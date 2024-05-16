/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */
import { runLanguageServer } from '../../common/language-server-runner.js';

export const runCppServer = () => {
    runLanguageServer({
        serverName: 'cpp',
        pathName: '/cpp',
        serverPort: 30002,
        runCommand: '/usr/bin/clangd',
        runCommandArgs: [
        ],
        wsServerOptions: {
            noServer: true,
            perMessageDeflate: false
        }
    });
};
