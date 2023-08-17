/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Uri } from 'monaco-editor';

import { MonacoLanguageClient, initServices } from 'monaco-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';

import { createConfiguredEditor } from 'vscode/monaco';
import { ExtensionHostKind, registerExtension } from 'vscode/extensions';
import { updateUserConfiguration } from 'vscode/service-override/configuration';
import 'vscode/default-extensions/theme-defaults';

import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

const languageId = 'langium';

const setup = async () => {
    console.log('Setting up Langium client configuration ...');
    const extension = {
        name: 'langium-client',
        publisher: 'monaco-languageclient-project',
        version: '1.0.0',
        engines: {
            vscode: '*'
        },
        contributes: {
            languages: [{
                id: languageId,
                extensions: [
                    `.${languageId}`
                ],
                aliases: [
                    languageId
                ],
                configuration: './langium-configuration.json'
            }],
            grammars: [{
                language: languageId,
                scopeName: 'source.langium',
                path: './langium-grammar.json'
            }]
        }
    };
    const { registerFileUrl } = registerExtension(extension, ExtensionHostKind.LocalProcess);

    // these two files are taken from the langium-vscode
    registerFileUrl('/langium-configuration.json', new URL('./src/langium/langium.configuration.json', window.location.href).href);
    registerFileUrl('/langium-grammar.json', new URL('./src/langium/langium.tmLanguage.json', window.location.href).href);

    // set vscode configuration parameters
    updateUserConfiguration(`{
    "workbench.colorTheme": "Default Dark Modern"
}`);
};

const run = async () => {
    const exampleLangiumUrl = new URL('./src/langium/example.langium', window.location.href).href;
    const editorText = await (await fetch(exampleLangiumUrl)).text();

    const editorOptions = {
        model: editor.createModel(editorText, languageId, Uri.parse('inmemory://example.langium')),
        automaticLayout: true
    };
    createConfiguredEditor(document.getElementById('container')!, editorOptions);

    function createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
        return new MonacoLanguageClient({
            name: 'Langium Client',
            clientOptions: {
                // use a language id as a document selector
                documentSelector: [{ language: languageId }],
                // disable the default error handler
                errorHandler: {
                    error: () => ({ action: ErrorAction.Continue }),
                    closed: () => ({ action: CloseAction.DoNotRestart })
                }
            },
            // create a language client connection to the server running in the web worker
            connectionProvider: {
                get: () => {
                    return Promise.resolve(transports);
                }
            }
        });
    }

    // works only if browser supports module workers
    const langiumWorkerUrl = new URL('./src/langium/langiumServerWorker.ts', window.location.href).href;
    // use this if module workers aren't supported
    // const langiumWorkerUrl = new URL('./dist/worker/langiumServerWorker.js', window.location.href).href;
    const worker = new Worker(langiumWorkerUrl, {
        type: 'module',
        name: 'Langium LS'
    });
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    const languageClient = createLanguageClient({ reader, writer });
    languageClient.start();
    reader.onClose(() => languageClient.stop());

    languageClient.onTelemetry((t) => {
        console.log(t);
    });

    languageClient.sendNotification('tester', { test: 'test' });

    // any further language client / server interaction can't be defined as needed
};

try {
    await initServices({
        enableThemeService: true,
        enableTextmateService: true,
        enableModelService: true,
        configureEditorOrViewsService: {
        },
        configureConfigurationService: {
            defaultWorkspaceUri: '/tmp'
        },
        enableKeybindingsService: true,
        enableLanguagesService: true,
        debugLogging: true
    });
    await setup();
    await run();
} catch (e) {
    console.log(e);
}