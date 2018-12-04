REM List of commands:


REM downgrade event-stream (because of https://github.com/dominictarr/event-stream/issues/116)
npm install event-stream@3.3.4


REM update event-stream to the latest (https://docs.npmjs.com/updating-packages-downloaded-from-the-registry)
npm update event-stream


REM Publishing code extension (https://code.visualstudio.com/docs/extensions/publish-extension)

REM minor
vsce publish minor

REM patch
bsce publish patch

REM install class-transformer
npm install class-transformer --save

REM update API
REM update package.json > engines.vscode
npm install