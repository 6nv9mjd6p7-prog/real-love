import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync('app/native-links.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {allowedAppRoute,nativeDestination,productionOrigin}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

assert.equal(allowedAppRoute('discover'),'discover');
assert.equal(allowedAppRoute('#conversations/requests'),'conversations/requests');
assert.equal(allowedAppRoute('chat/connection_12'),'chat/connection_12');
assert.equal(allowedAppRoute('circles/circle-12'),'circles/circle-12');
assert.equal(allowedAppRoute('chat/a/b'),null,'nested paths cannot escape the app route grammar');
assert.equal(allowedAppRoute('settings?external=true'),null,'route parameters cannot be smuggled into a hash route');
assert.equal(allowedAppRoute('%E0%A4%A'),null,'malformed encoding is rejected');

assert.deepEqual(nativeDestination('reallove://discover'),{kind:'hash',value:'discover'});
assert.deepEqual(nativeDestination('reallove:///chat/connection_12'),{kind:'hash',value:'chat/connection_12'});
assert.deepEqual(nativeDestination('reallove://open?route=conversations%2Frequests'),{kind:'hash',value:'conversations/requests'});
assert.deepEqual(nativeDestination(productionOrigin+'/#circles/circle-12'),{kind:'hash',value:'circles/circle-12'});
assert.deepEqual(nativeDestination(productionOrigin+'/auth?next=%2F'),{kind:'path',value:'/auth?next=%2F'});
assert.equal(nativeDestination('https://example.test/#discover'),null,'external origins cannot navigate the native WebView');
assert.equal(nativeDestination('reallove://open?route=https%3A%2F%2Fevil.test'),null,'custom links cannot contain arbitrary destinations');
assert.equal(nativeDestination('not a URL'),null);

const plist=readFileSync('ios/App/App/Info.plist','utf8');
for(const key of ['NSMicrophoneUsageDescription','NSCameraUsageDescription','NSPhotoLibraryUsageDescription','CFBundleURLTypes','ITSAppUsesNonExemptEncryption'])assert(plist.includes(`<key>${key}</key>`),`${key} must remain declared in Info.plist`);
assert(plist.includes('<string>reallove</string>'),'the private deep-link scheme must remain registered');
assert(!plist.includes('NSAllowsArbitraryLoads'),'the native app must not weaken App Transport Security');

const config=readFileSync('capacitor.config.ts','utf8');
assert(config.includes("appId: 'app.reallove.connections'"));
assert(config.includes('cleartext: false'));
assert(config.includes("loggingBehavior: 'none'"),'production native logs stay disabled for private app activity');
assert(config.includes("errorPath: 'offline.html'"));

const runtime=readFileSync('app/native-runtime.tsx','utf8');
assert(runtime.includes('Capacitor.isNativePlatform()'));
assert(runtime.includes("App.addListener('appUrlOpen'"));
assert(runtime.includes("App.addListener('appStateChange'"));
assert(runtime.includes('Browser.open('),'external links use the native browser instead of the private app WebView');

const pkg=JSON.parse(readFileSync('package.json','utf8'));
assert.equal(pkg.dependencies['@capacitor/core'],pkg.dependencies['@capacitor/ios']);
assert.equal(pkg.devDependencies['@capacitor/cli'],pkg.dependencies['@capacitor/core']);
assert.equal(pkg.scripts['native:sync'],'cap sync ios');

console.log('Native iOS routing, origin boundaries, privacy metadata, shell configuration, and dependency alignment checks passed');
