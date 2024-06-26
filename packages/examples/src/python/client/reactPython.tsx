/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createUserConfig } from './config.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        basePath: '../../../node_modules'
    });
};

export const runPythonReact = () => {
    /**
     * Code is intentionally incorrect - language server will pick this up on connection and highlight the error
     */
    const code = `def main():
        return pass`;

    const onTextChanged = (text: string, isDirty: boolean) => {
        console.log(`Dirty? ${isDirty} Content: ${text}`);
    };

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <MonacoEditorReactComp
                userConfig={createUserConfig(code)}
                style={{
                    'paddingTop': '5px',
                    'height': '80vh'
                }}
                onTextChanged={onTextChanged}
                onLoad={(wrapper: MonacoEditorLanguageClientWrapper) => {
                    console.log(`Loaded ${wrapper.reportStatus().join('\n').toString()}`);
                }}
                onError={(e) => {
                    console.error(e);
                }}
            />
        </StrictMode>);
};
