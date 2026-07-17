// Generated from schema/theme.schema.json. Do not edit by hand.
// @ts-nocheck -- Ajv emits optimized JavaScript without TypeScript annotations.
import ucs2LengthRuntime from "ajv/dist/runtime/ucs2length.js";
import deepEqualRuntime from "ajv/dist/runtime/equal.js";
import { fullFormats } from "ajv-formats/dist/formats.js";

// Node ESM exposes these CommonJS helpers as { default }, while Vite unwraps them.
const ucs2Length = ucs2LengthRuntime.default ?? ucs2LengthRuntime;
const deepEqual = deepEqualRuntime.default ?? deepEqualRuntime;

"use strict";
export const validate = validate20;
export default validate20;
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://xuhuanstudio.github.io/codex-styler/schema/theme-v1.json","title":"Codex Styler Theme v1","type":"object","additionalProperties":false,"required":["format","id","version","metadata","compatibility","variants","scene","assets","locales"],"properties":{"format":{"const":"codex-styler-theme-v1"},"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9.-]{2,63}$"},"version":{"type":"string","pattern":"^[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$"},"metadata":{"type":"object","additionalProperties":false,"required":["name","description","author","license","tags"],"properties":{"name":{"type":"string","minLength":1,"maxLength":64},"description":{"type":"string","minLength":1,"maxLength":240},"author":{"type":"string","minLength":1,"maxLength":80},"license":{"type":"string","minLength":1,"maxLength":64},"tags":{"type":"array","maxItems":12,"uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":32}},"homepage":{"type":"string","format":"uri","maxLength":240},"preview":{"$ref":"#/$defs/assetPath"},"recommendedCompanionId":{"type":"string","pattern":"^[a-z0-9][a-z0-9.-]{2,63}$"}}},"compatibility":{"type":"object","additionalProperties":false,"required":["styler","codex"],"properties":{"styler":{"type":"object","additionalProperties":false,"required":["minimumVersion"],"properties":{"minimumVersion":{"type":"string","pattern":"^[0-9]+\\.[0-9]+\\.[0-9]+"}}},"codex":{"type":"object","additionalProperties":false,"required":["mode","testedVersions"],"properties":{"mode":{"enum":["safe","semantic"]},"testedVersions":{"type":"array","maxItems":32,"items":{"type":"string","minLength":1,"maxLength":40}}}}}},"variants":{"type":"object","additionalProperties":false,"required":["light","dark"],"properties":{"light":{"$ref":"#/$defs/variant"},"dark":{"$ref":"#/$defs/variant"}}},"scene":{"type":"object","additionalProperties":false,"required":["layers","entities"],"properties":{"layers":{"type":"array","maxItems":8,"items":{"$ref":"#/$defs/layer"}},"entities":{"type":"array","maxItems":1,"items":{"$ref":"#/$defs/entity"}}}},"assets":{"type":"array","maxItems":32,"items":{"$ref":"#/$defs/asset"}},"locales":{"type":"object","additionalProperties":{"type":"object","additionalProperties":false,"required":["name","description"],"properties":{"name":{"type":"string","minLength":1,"maxLength":64},"description":{"type":"string","minLength":1,"maxLength":240}}}}},"$defs":{"assetPath":{"type":"string","pattern":"^(assets|previews)/[A-Za-z0-9._/-]+$","maxLength":180},"color":{"type":"string","pattern":"^#[0-9A-Fa-f]{6}$"},"variant":{"type":"object","additionalProperties":false,"required":["background","appearance","motion"],"properties":{"background":{"type":"object","additionalProperties":false,"required":["color","position","brightness","blur","overlay","overlayOpacity"],"properties":{"color":{"$ref":"#/$defs/color"},"image":{"$ref":"#/$defs/assetPath"},"position":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":0,"maximum":100},"y":{"type":"number","minimum":0,"maximum":100}}},"brightness":{"type":"number","minimum":0.2,"maximum":2},"blur":{"type":"number","minimum":0,"maximum":40},"overlay":{"$ref":"#/$defs/color"},"overlayOpacity":{"type":"number","minimum":0,"maximum":1}}},"appearance":{"type":"object","additionalProperties":false,"required":["accent","surface","surfaceOpacity","text","mutedText","border","radius","focusOpacity","focusBlur"],"properties":{"accent":{"$ref":"#/$defs/color"},"surface":{"$ref":"#/$defs/color"},"surfaceOpacity":{"type":"number","minimum":0,"maximum":1},"text":{"$ref":"#/$defs/color"},"mutedText":{"$ref":"#/$defs/color"},"border":{"$ref":"#/$defs/color"},"radius":{"type":"number","minimum":0,"maximum":32},"focusOpacity":{"type":"number","minimum":0,"maximum":1},"focusBlur":{"type":"number","minimum":0,"maximum":32},"layout":{"enum":["native","editorial","immersive"]},"iconStyle":{"enum":["native","contained","themed"]},"decorations":{"enum":["none","subtle","expressive"]},"palette":{"type":"object","additionalProperties":false,"properties":{"canvas":{"$ref":"#/$defs/color"},"surfaceRaised":{"$ref":"#/$defs/color"},"surfaceOverlay":{"$ref":"#/$defs/color"},"surfaceSunken":{"$ref":"#/$defs/color"},"control":{"$ref":"#/$defs/color"},"controlHover":{"$ref":"#/$defs/color"},"controlActive":{"$ref":"#/$defs/color"},"textTertiary":{"$ref":"#/$defs/color"},"onAccent":{"$ref":"#/$defs/color"},"borderSubtle":{"$ref":"#/$defs/color"},"borderStrong":{"$ref":"#/$defs/color"},"focus":{"$ref":"#/$defs/color"},"success":{"$ref":"#/$defs/color"},"warning":{"$ref":"#/$defs/color"},"danger":{"$ref":"#/$defs/color"},"info":{"$ref":"#/$defs/color"},"added":{"$ref":"#/$defs/color"},"modified":{"$ref":"#/$defs/color"},"deleted":{"$ref":"#/$defs/color"}}}}},"motion":{"type":"object","additionalProperties":false,"required":["intensity","parallax","targetFps"],"properties":{"intensity":{"type":"number","minimum":0,"maximum":1},"parallax":{"type":"number","minimum":0,"maximum":30},"targetFps":{"enum":[24,30,60]}}}}},"layer":{"type":"object","additionalProperties":false,"required":["id","type","opacity","blendMode","parallax"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"type":{"enum":["image","gradient","vignette"]},"asset":{"$ref":"#/$defs/assetPath"},"opacity":{"type":"number","minimum":0,"maximum":1},"blendMode":{"enum":["normal","multiply","screen","overlay","soft-light"]},"parallax":{"type":"number","minimum":-30,"maximum":30}}},"entity":{"type":"object","additionalProperties":false,"required":["id","name","renderer","behaviors","anchor","size","opacity"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"name":{"type":"string","minLength":1,"maxLength":64},"renderer":{"oneOf":[{"type":"object","additionalProperties":false,"required":["type","asset"],"properties":{"type":{"const":"image"},"asset":{"$ref":"#/$defs/assetPath"},"normalization":{"enum":["preserve","grounded"]},"alphaThreshold":{"type":"integer","minimum":0,"maximum":255}}},{"type":"object","additionalProperties":false,"required":["type","asset","columns","rows","frameWidth","frameHeight","directions"],"properties":{"type":{"const":"sprite-atlas"},"asset":{"$ref":"#/$defs/assetPath"},"pages":{"type":"array","minItems":1,"maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/assetPath"}},"columns":{"type":"integer","minimum":1,"maximum":16},"rows":{"type":"integer","minimum":1,"maximum":16},"framesPerPage":{"type":"integer","minimum":1,"maximum":256},"frameWidth":{"type":"integer","minimum":16,"maximum":1024},"frameHeight":{"type":"integer","minimum":16,"maximum":1024},"directions":{"type":"integer","minimum":4,"maximum":512},"frameCount":{"type":"integer","minimum":1,"maximum":512},"frameAngles":{"type":"array","minItems":4,"maxItems":512,"items":{"type":"number","minimum":0,"maximum":360}},"poses":{"type":"array","minItems":4,"maxItems":512,"items":{"$ref":"#/$defs/companionPose"}},"idleClips":{"type":"array","maxItems":64,"items":{"$ref":"#/$defs/idleClip"}},"neutralFrame":{"type":"integer","minimum":0,"maximum":511},"reducedMotionFrame":{"type":"integer","minimum":0,"maximum":511},"transitionFps":{"type":"integer","minimum":12,"maximum":60},"followSmoothing":{"type":"number","minimum":0.02,"maximum":1},"normalization":{"enum":["preserve","grounded"]},"alphaThreshold":{"type":"integer","minimum":0,"maximum":255}}}]},"behaviors":{"type":"array","uniqueItems":true,"items":{"enum":["idle","parallax","look-at-pointer","reduce-motion-fallback"]}},"anchor":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":0,"maximum":100},"y":{"type":"number","minimum":0,"maximum":100}}},"attachment":{"type":"object","additionalProperties":false,"required":["target","edge","align","offset"],"properties":{"target":{"enum":["composer","main-surface","thread-summary"]},"edge":{"enum":["top","bottom"]},"align":{"type":"number","minimum":0,"maximum":1},"offset":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":-512,"maximum":512},"y":{"type":"number","minimum":-512,"maximum":512}}}}},"size":{"type":"number","minimum":24,"maximum":512},"opacity":{"type":"number","minimum":0,"maximum":1}}},"companionPose":{"type":"object","additionalProperties":false,"required":["id","angle","frame"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"angle":{"type":"number","minimum":0,"exclusiveMaximum":360},"frame":{"type":"integer","minimum":0,"maximum":511}}},"idleClip":{"type":"object","additionalProperties":false,"required":["id","poseIds","frames","minimumDelayMs","maximumDelayMs"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"poseIds":{"type":"array","minItems":1,"maxItems":512,"uniqueItems":true,"items":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"}},"frames":{"type":"array","minItems":1,"maxItems":120,"items":{"type":"object","additionalProperties":false,"required":["frame","durationMs"],"properties":{"frame":{"type":"integer","minimum":0,"maximum":511},"durationMs":{"type":"integer","minimum":16,"maximum":5000}}}},"minimumDelayMs":{"type":"integer","minimum":250,"maximum":120000},"maximumDelayMs":{"type":"integer","minimum":250,"maximum":120000}}},"asset":{"type":"object","additionalProperties":false,"required":["id","path","type","license"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"path":{"$ref":"#/$defs/assetPath"},"type":{"enum":["background","image","sprite-atlas","preview"]},"license":{"type":"string","minLength":1,"maxLength":64}}}}};
const schema32 = {"type":"string","pattern":"^(assets|previews)/[A-Za-z0-9._/-]+$","maxLength":180};
const func1 = Object.prototype.hasOwnProperty;
const func2 = ucs2Length;
const pattern4 = new RegExp("^[a-z0-9][a-z0-9.-]{2,63}$", "u");
const pattern5 = new RegExp("^[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$", "u");
const pattern6 = new RegExp("^(assets|previews)/[A-Za-z0-9._/-]+$", "u");
const pattern8 = new RegExp("^[0-9]+\\.[0-9]+\\.[0-9]+", "u");
const formats0 = fullFormats.uri;
const schema33 = {"type":"object","additionalProperties":false,"required":["background","appearance","motion"],"properties":{"background":{"type":"object","additionalProperties":false,"required":["color","position","brightness","blur","overlay","overlayOpacity"],"properties":{"color":{"$ref":"#/$defs/color"},"image":{"$ref":"#/$defs/assetPath"},"position":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":0,"maximum":100},"y":{"type":"number","minimum":0,"maximum":100}}},"brightness":{"type":"number","minimum":0.2,"maximum":2},"blur":{"type":"number","minimum":0,"maximum":40},"overlay":{"$ref":"#/$defs/color"},"overlayOpacity":{"type":"number","minimum":0,"maximum":1}}},"appearance":{"type":"object","additionalProperties":false,"required":["accent","surface","surfaceOpacity","text","mutedText","border","radius","focusOpacity","focusBlur"],"properties":{"accent":{"$ref":"#/$defs/color"},"surface":{"$ref":"#/$defs/color"},"surfaceOpacity":{"type":"number","minimum":0,"maximum":1},"text":{"$ref":"#/$defs/color"},"mutedText":{"$ref":"#/$defs/color"},"border":{"$ref":"#/$defs/color"},"radius":{"type":"number","minimum":0,"maximum":32},"focusOpacity":{"type":"number","minimum":0,"maximum":1},"focusBlur":{"type":"number","minimum":0,"maximum":32},"layout":{"enum":["native","editorial","immersive"]},"iconStyle":{"enum":["native","contained","themed"]},"decorations":{"enum":["none","subtle","expressive"]},"palette":{"type":"object","additionalProperties":false,"properties":{"canvas":{"$ref":"#/$defs/color"},"surfaceRaised":{"$ref":"#/$defs/color"},"surfaceOverlay":{"$ref":"#/$defs/color"},"surfaceSunken":{"$ref":"#/$defs/color"},"control":{"$ref":"#/$defs/color"},"controlHover":{"$ref":"#/$defs/color"},"controlActive":{"$ref":"#/$defs/color"},"textTertiary":{"$ref":"#/$defs/color"},"onAccent":{"$ref":"#/$defs/color"},"borderSubtle":{"$ref":"#/$defs/color"},"borderStrong":{"$ref":"#/$defs/color"},"focus":{"$ref":"#/$defs/color"},"success":{"$ref":"#/$defs/color"},"warning":{"$ref":"#/$defs/color"},"danger":{"$ref":"#/$defs/color"},"info":{"$ref":"#/$defs/color"},"added":{"$ref":"#/$defs/color"},"modified":{"$ref":"#/$defs/color"},"deleted":{"$ref":"#/$defs/color"}}}}},"motion":{"type":"object","additionalProperties":false,"required":["intensity","parallax","targetFps"],"properties":{"intensity":{"type":"number","minimum":0,"maximum":1},"parallax":{"type":"number","minimum":0,"maximum":30},"targetFps":{"enum":[24,30,60]}}}}};
const schema34 = {"type":"string","pattern":"^#[0-9A-Fa-f]{6}$"};
const pattern9 = new RegExp("^#[0-9A-Fa-f]{6}$", "u");

function validate21(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate21.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.background === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "background"},message:"must have required property '"+"background"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.appearance === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "appearance"},message:"must have required property '"+"appearance"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.motion === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "motion"},message:"must have required property '"+"motion"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "background") || (key0 === "appearance")) || (key0 === "motion"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.background !== undefined){
let data0 = data.background;
if(data0 && typeof data0 == "object" && !Array.isArray(data0)){
if(data0.color === undefined){
const err4 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/required",keyword:"required",params:{missingProperty: "color"},message:"must have required property '"+"color"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data0.position === undefined){
const err5 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/required",keyword:"required",params:{missingProperty: "position"},message:"must have required property '"+"position"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data0.brightness === undefined){
const err6 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/required",keyword:"required",params:{missingProperty: "brightness"},message:"must have required property '"+"brightness"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data0.blur === undefined){
const err7 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/required",keyword:"required",params:{missingProperty: "blur"},message:"must have required property '"+"blur"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data0.overlay === undefined){
const err8 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/required",keyword:"required",params:{missingProperty: "overlay"},message:"must have required property '"+"overlay"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data0.overlayOpacity === undefined){
const err9 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/required",keyword:"required",params:{missingProperty: "overlayOpacity"},message:"must have required property '"+"overlayOpacity"+"'"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
for(const key1 in data0){
if(!(((((((key1 === "color") || (key1 === "image")) || (key1 === "position")) || (key1 === "brightness")) || (key1 === "blur")) || (key1 === "overlay")) || (key1 === "overlayOpacity"))){
const err10 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data0.color !== undefined){
let data1 = data0.color;
if(typeof data1 === "string"){
if(!pattern9.test(data1)){
const err11 = {instancePath:instancePath+"/background/color",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/background/color",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data0.image !== undefined){
let data2 = data0.image;
if(typeof data2 === "string"){
if(func2(data2) > 180){
const err13 = {instancePath:instancePath+"/background/image",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(!pattern6.test(data2)){
const err14 = {instancePath:instancePath+"/background/image",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
else {
const err15 = {instancePath:instancePath+"/background/image",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data0.position !== undefined){
let data3 = data0.position;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.x === undefined){
const err16 = {instancePath:instancePath+"/background/position",schemaPath:"#/properties/background/properties/position/required",keyword:"required",params:{missingProperty: "x"},message:"must have required property '"+"x"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data3.y === undefined){
const err17 = {instancePath:instancePath+"/background/position",schemaPath:"#/properties/background/properties/position/required",keyword:"required",params:{missingProperty: "y"},message:"must have required property '"+"y"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key2 in data3){
if(!((key2 === "x") || (key2 === "y"))){
const err18 = {instancePath:instancePath+"/background/position",schemaPath:"#/properties/background/properties/position/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data3.x !== undefined){
let data4 = data3.x;
if((typeof data4 == "number") && (isFinite(data4))){
if(data4 > 100 || isNaN(data4)){
const err19 = {instancePath:instancePath+"/background/position/x",schemaPath:"#/properties/background/properties/position/properties/x/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data4 < 0 || isNaN(data4)){
const err20 = {instancePath:instancePath+"/background/position/x",schemaPath:"#/properties/background/properties/position/properties/x/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
else {
const err21 = {instancePath:instancePath+"/background/position/x",schemaPath:"#/properties/background/properties/position/properties/x/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data3.y !== undefined){
let data5 = data3.y;
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 100 || isNaN(data5)){
const err22 = {instancePath:instancePath+"/background/position/y",schemaPath:"#/properties/background/properties/position/properties/y/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err23 = {instancePath:instancePath+"/background/position/y",schemaPath:"#/properties/background/properties/position/properties/y/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
else {
const err24 = {instancePath:instancePath+"/background/position/y",schemaPath:"#/properties/background/properties/position/properties/y/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
else {
const err25 = {instancePath:instancePath+"/background/position",schemaPath:"#/properties/background/properties/position/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data0.brightness !== undefined){
let data6 = data0.brightness;
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 > 2 || isNaN(data6)){
const err26 = {instancePath:instancePath+"/background/brightness",schemaPath:"#/properties/background/properties/brightness/maximum",keyword:"maximum",params:{comparison: "<=", limit: 2},message:"must be <= 2"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data6 < 0.2 || isNaN(data6)){
const err27 = {instancePath:instancePath+"/background/brightness",schemaPath:"#/properties/background/properties/brightness/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0.2},message:"must be >= 0.2"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
else {
const err28 = {instancePath:instancePath+"/background/brightness",schemaPath:"#/properties/background/properties/brightness/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data0.blur !== undefined){
let data7 = data0.blur;
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 > 40 || isNaN(data7)){
const err29 = {instancePath:instancePath+"/background/blur",schemaPath:"#/properties/background/properties/blur/maximum",keyword:"maximum",params:{comparison: "<=", limit: 40},message:"must be <= 40"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data7 < 0 || isNaN(data7)){
const err30 = {instancePath:instancePath+"/background/blur",schemaPath:"#/properties/background/properties/blur/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
else {
const err31 = {instancePath:instancePath+"/background/blur",schemaPath:"#/properties/background/properties/blur/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data0.overlay !== undefined){
let data8 = data0.overlay;
if(typeof data8 === "string"){
if(!pattern9.test(data8)){
const err32 = {instancePath:instancePath+"/background/overlay",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
else {
const err33 = {instancePath:instancePath+"/background/overlay",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data0.overlayOpacity !== undefined){
let data9 = data0.overlayOpacity;
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 > 1 || isNaN(data9)){
const err34 = {instancePath:instancePath+"/background/overlayOpacity",schemaPath:"#/properties/background/properties/overlayOpacity/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data9 < 0 || isNaN(data9)){
const err35 = {instancePath:instancePath+"/background/overlayOpacity",schemaPath:"#/properties/background/properties/overlayOpacity/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
else {
const err36 = {instancePath:instancePath+"/background/overlayOpacity",schemaPath:"#/properties/background/properties/overlayOpacity/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
}
else {
const err37 = {instancePath:instancePath+"/background",schemaPath:"#/properties/background/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data.appearance !== undefined){
let data10 = data.appearance;
if(data10 && typeof data10 == "object" && !Array.isArray(data10)){
if(data10.accent === undefined){
const err38 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "accent"},message:"must have required property '"+"accent"+"'"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(data10.surface === undefined){
const err39 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "surface"},message:"must have required property '"+"surface"+"'"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data10.surfaceOpacity === undefined){
const err40 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "surfaceOpacity"},message:"must have required property '"+"surfaceOpacity"+"'"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data10.text === undefined){
const err41 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "text"},message:"must have required property '"+"text"+"'"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data10.mutedText === undefined){
const err42 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "mutedText"},message:"must have required property '"+"mutedText"+"'"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data10.border === undefined){
const err43 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "border"},message:"must have required property '"+"border"+"'"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
if(data10.radius === undefined){
const err44 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "radius"},message:"must have required property '"+"radius"+"'"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if(data10.focusOpacity === undefined){
const err45 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "focusOpacity"},message:"must have required property '"+"focusOpacity"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data10.focusBlur === undefined){
const err46 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/required",keyword:"required",params:{missingProperty: "focusBlur"},message:"must have required property '"+"focusBlur"+"'"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
for(const key3 in data10){
if(!(func1.call(schema33.properties.appearance.properties, key3))){
const err47 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data10.accent !== undefined){
let data11 = data10.accent;
if(typeof data11 === "string"){
if(!pattern9.test(data11)){
const err48 = {instancePath:instancePath+"/appearance/accent",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
else {
const err49 = {instancePath:instancePath+"/appearance/accent",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data10.surface !== undefined){
let data12 = data10.surface;
if(typeof data12 === "string"){
if(!pattern9.test(data12)){
const err50 = {instancePath:instancePath+"/appearance/surface",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
else {
const err51 = {instancePath:instancePath+"/appearance/surface",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
if(data10.surfaceOpacity !== undefined){
let data13 = data10.surfaceOpacity;
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 1 || isNaN(data13)){
const err52 = {instancePath:instancePath+"/appearance/surfaceOpacity",schemaPath:"#/properties/appearance/properties/surfaceOpacity/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
if(data13 < 0 || isNaN(data13)){
const err53 = {instancePath:instancePath+"/appearance/surfaceOpacity",schemaPath:"#/properties/appearance/properties/surfaceOpacity/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
else {
const err54 = {instancePath:instancePath+"/appearance/surfaceOpacity",schemaPath:"#/properties/appearance/properties/surfaceOpacity/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data10.text !== undefined){
let data14 = data10.text;
if(typeof data14 === "string"){
if(!pattern9.test(data14)){
const err55 = {instancePath:instancePath+"/appearance/text",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
else {
const err56 = {instancePath:instancePath+"/appearance/text",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data10.mutedText !== undefined){
let data15 = data10.mutedText;
if(typeof data15 === "string"){
if(!pattern9.test(data15)){
const err57 = {instancePath:instancePath+"/appearance/mutedText",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
}
else {
const err58 = {instancePath:instancePath+"/appearance/mutedText",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data10.border !== undefined){
let data16 = data10.border;
if(typeof data16 === "string"){
if(!pattern9.test(data16)){
const err59 = {instancePath:instancePath+"/appearance/border",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
else {
const err60 = {instancePath:instancePath+"/appearance/border",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data10.radius !== undefined){
let data17 = data10.radius;
if((typeof data17 == "number") && (isFinite(data17))){
if(data17 > 32 || isNaN(data17)){
const err61 = {instancePath:instancePath+"/appearance/radius",schemaPath:"#/properties/appearance/properties/radius/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32},message:"must be <= 32"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(data17 < 0 || isNaN(data17)){
const err62 = {instancePath:instancePath+"/appearance/radius",schemaPath:"#/properties/appearance/properties/radius/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
else {
const err63 = {instancePath:instancePath+"/appearance/radius",schemaPath:"#/properties/appearance/properties/radius/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
if(data10.focusOpacity !== undefined){
let data18 = data10.focusOpacity;
if((typeof data18 == "number") && (isFinite(data18))){
if(data18 > 1 || isNaN(data18)){
const err64 = {instancePath:instancePath+"/appearance/focusOpacity",schemaPath:"#/properties/appearance/properties/focusOpacity/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data18 < 0 || isNaN(data18)){
const err65 = {instancePath:instancePath+"/appearance/focusOpacity",schemaPath:"#/properties/appearance/properties/focusOpacity/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
else {
const err66 = {instancePath:instancePath+"/appearance/focusOpacity",schemaPath:"#/properties/appearance/properties/focusOpacity/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data10.focusBlur !== undefined){
let data19 = data10.focusBlur;
if((typeof data19 == "number") && (isFinite(data19))){
if(data19 > 32 || isNaN(data19)){
const err67 = {instancePath:instancePath+"/appearance/focusBlur",schemaPath:"#/properties/appearance/properties/focusBlur/maximum",keyword:"maximum",params:{comparison: "<=", limit: 32},message:"must be <= 32"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data19 < 0 || isNaN(data19)){
const err68 = {instancePath:instancePath+"/appearance/focusBlur",schemaPath:"#/properties/appearance/properties/focusBlur/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
else {
const err69 = {instancePath:instancePath+"/appearance/focusBlur",schemaPath:"#/properties/appearance/properties/focusBlur/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data10.layout !== undefined){
let data20 = data10.layout;
if(!(((data20 === "native") || (data20 === "editorial")) || (data20 === "immersive"))){
const err70 = {instancePath:instancePath+"/appearance/layout",schemaPath:"#/properties/appearance/properties/layout/enum",keyword:"enum",params:{allowedValues: schema33.properties.appearance.properties.layout.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data10.iconStyle !== undefined){
let data21 = data10.iconStyle;
if(!(((data21 === "native") || (data21 === "contained")) || (data21 === "themed"))){
const err71 = {instancePath:instancePath+"/appearance/iconStyle",schemaPath:"#/properties/appearance/properties/iconStyle/enum",keyword:"enum",params:{allowedValues: schema33.properties.appearance.properties.iconStyle.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
if(data10.decorations !== undefined){
let data22 = data10.decorations;
if(!(((data22 === "none") || (data22 === "subtle")) || (data22 === "expressive"))){
const err72 = {instancePath:instancePath+"/appearance/decorations",schemaPath:"#/properties/appearance/properties/decorations/enum",keyword:"enum",params:{allowedValues: schema33.properties.appearance.properties.decorations.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data10.palette !== undefined){
let data23 = data10.palette;
if(data23 && typeof data23 == "object" && !Array.isArray(data23)){
for(const key4 in data23){
if(!(func1.call(schema33.properties.appearance.properties.palette.properties, key4))){
const err73 = {instancePath:instancePath+"/appearance/palette",schemaPath:"#/properties/appearance/properties/palette/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data23.canvas !== undefined){
let data24 = data23.canvas;
if(typeof data24 === "string"){
if(!pattern9.test(data24)){
const err74 = {instancePath:instancePath+"/appearance/palette/canvas",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
}
else {
const err75 = {instancePath:instancePath+"/appearance/palette/canvas",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data23.surfaceRaised !== undefined){
let data25 = data23.surfaceRaised;
if(typeof data25 === "string"){
if(!pattern9.test(data25)){
const err76 = {instancePath:instancePath+"/appearance/palette/surfaceRaised",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
else {
const err77 = {instancePath:instancePath+"/appearance/palette/surfaceRaised",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
if(data23.surfaceOverlay !== undefined){
let data26 = data23.surfaceOverlay;
if(typeof data26 === "string"){
if(!pattern9.test(data26)){
const err78 = {instancePath:instancePath+"/appearance/palette/surfaceOverlay",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
else {
const err79 = {instancePath:instancePath+"/appearance/palette/surfaceOverlay",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
}
if(data23.surfaceSunken !== undefined){
let data27 = data23.surfaceSunken;
if(typeof data27 === "string"){
if(!pattern9.test(data27)){
const err80 = {instancePath:instancePath+"/appearance/palette/surfaceSunken",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
else {
const err81 = {instancePath:instancePath+"/appearance/palette/surfaceSunken",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
if(data23.control !== undefined){
let data28 = data23.control;
if(typeof data28 === "string"){
if(!pattern9.test(data28)){
const err82 = {instancePath:instancePath+"/appearance/palette/control",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
}
else {
const err83 = {instancePath:instancePath+"/appearance/palette/control",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
if(data23.controlHover !== undefined){
let data29 = data23.controlHover;
if(typeof data29 === "string"){
if(!pattern9.test(data29)){
const err84 = {instancePath:instancePath+"/appearance/palette/controlHover",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
else {
const err85 = {instancePath:instancePath+"/appearance/palette/controlHover",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
if(data23.controlActive !== undefined){
let data30 = data23.controlActive;
if(typeof data30 === "string"){
if(!pattern9.test(data30)){
const err86 = {instancePath:instancePath+"/appearance/palette/controlActive",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
else {
const err87 = {instancePath:instancePath+"/appearance/palette/controlActive",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
}
if(data23.textTertiary !== undefined){
let data31 = data23.textTertiary;
if(typeof data31 === "string"){
if(!pattern9.test(data31)){
const err88 = {instancePath:instancePath+"/appearance/palette/textTertiary",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
else {
const err89 = {instancePath:instancePath+"/appearance/palette/textTertiary",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
if(data23.onAccent !== undefined){
let data32 = data23.onAccent;
if(typeof data32 === "string"){
if(!pattern9.test(data32)){
const err90 = {instancePath:instancePath+"/appearance/palette/onAccent",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
else {
const err91 = {instancePath:instancePath+"/appearance/palette/onAccent",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
if(data23.borderSubtle !== undefined){
let data33 = data23.borderSubtle;
if(typeof data33 === "string"){
if(!pattern9.test(data33)){
const err92 = {instancePath:instancePath+"/appearance/palette/borderSubtle",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
}
else {
const err93 = {instancePath:instancePath+"/appearance/palette/borderSubtle",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data23.borderStrong !== undefined){
let data34 = data23.borderStrong;
if(typeof data34 === "string"){
if(!pattern9.test(data34)){
const err94 = {instancePath:instancePath+"/appearance/palette/borderStrong",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
else {
const err95 = {instancePath:instancePath+"/appearance/palette/borderStrong",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data23.focus !== undefined){
let data35 = data23.focus;
if(typeof data35 === "string"){
if(!pattern9.test(data35)){
const err96 = {instancePath:instancePath+"/appearance/palette/focus",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
}
else {
const err97 = {instancePath:instancePath+"/appearance/palette/focus",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
}
if(data23.success !== undefined){
let data36 = data23.success;
if(typeof data36 === "string"){
if(!pattern9.test(data36)){
const err98 = {instancePath:instancePath+"/appearance/palette/success",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
else {
const err99 = {instancePath:instancePath+"/appearance/palette/success",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
if(data23.warning !== undefined){
let data37 = data23.warning;
if(typeof data37 === "string"){
if(!pattern9.test(data37)){
const err100 = {instancePath:instancePath+"/appearance/palette/warning",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
}
}
else {
const err101 = {instancePath:instancePath+"/appearance/palette/warning",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data23.danger !== undefined){
let data38 = data23.danger;
if(typeof data38 === "string"){
if(!pattern9.test(data38)){
const err102 = {instancePath:instancePath+"/appearance/palette/danger",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
}
else {
const err103 = {instancePath:instancePath+"/appearance/palette/danger",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
}
if(data23.info !== undefined){
let data39 = data23.info;
if(typeof data39 === "string"){
if(!pattern9.test(data39)){
const err104 = {instancePath:instancePath+"/appearance/palette/info",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
}
else {
const err105 = {instancePath:instancePath+"/appearance/palette/info",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
}
if(data23.added !== undefined){
let data40 = data23.added;
if(typeof data40 === "string"){
if(!pattern9.test(data40)){
const err106 = {instancePath:instancePath+"/appearance/palette/added",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
else {
const err107 = {instancePath:instancePath+"/appearance/palette/added",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
}
if(data23.modified !== undefined){
let data41 = data23.modified;
if(typeof data41 === "string"){
if(!pattern9.test(data41)){
const err108 = {instancePath:instancePath+"/appearance/palette/modified",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
}
else {
const err109 = {instancePath:instancePath+"/appearance/palette/modified",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
if(data23.deleted !== undefined){
let data42 = data23.deleted;
if(typeof data42 === "string"){
if(!pattern9.test(data42)){
const err110 = {instancePath:instancePath+"/appearance/palette/deleted",schemaPath:"#/$defs/color/pattern",keyword:"pattern",params:{pattern: "^#[0-9A-Fa-f]{6}$"},message:"must match pattern \""+"^#[0-9A-Fa-f]{6}$"+"\""};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
}
else {
const err111 = {instancePath:instancePath+"/appearance/palette/deleted",schemaPath:"#/$defs/color/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
}
}
else {
const err112 = {instancePath:instancePath+"/appearance/palette",schemaPath:"#/properties/appearance/properties/palette/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
}
else {
const err113 = {instancePath:instancePath+"/appearance",schemaPath:"#/properties/appearance/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
if(data.motion !== undefined){
let data43 = data.motion;
if(data43 && typeof data43 == "object" && !Array.isArray(data43)){
if(data43.intensity === undefined){
const err114 = {instancePath:instancePath+"/motion",schemaPath:"#/properties/motion/required",keyword:"required",params:{missingProperty: "intensity"},message:"must have required property '"+"intensity"+"'"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
if(data43.parallax === undefined){
const err115 = {instancePath:instancePath+"/motion",schemaPath:"#/properties/motion/required",keyword:"required",params:{missingProperty: "parallax"},message:"must have required property '"+"parallax"+"'"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if(data43.targetFps === undefined){
const err116 = {instancePath:instancePath+"/motion",schemaPath:"#/properties/motion/required",keyword:"required",params:{missingProperty: "targetFps"},message:"must have required property '"+"targetFps"+"'"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
for(const key5 in data43){
if(!(((key5 === "intensity") || (key5 === "parallax")) || (key5 === "targetFps"))){
const err117 = {instancePath:instancePath+"/motion",schemaPath:"#/properties/motion/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
if(data43.intensity !== undefined){
let data44 = data43.intensity;
if((typeof data44 == "number") && (isFinite(data44))){
if(data44 > 1 || isNaN(data44)){
const err118 = {instancePath:instancePath+"/motion/intensity",schemaPath:"#/properties/motion/properties/intensity/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if(data44 < 0 || isNaN(data44)){
const err119 = {instancePath:instancePath+"/motion/intensity",schemaPath:"#/properties/motion/properties/intensity/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
}
else {
const err120 = {instancePath:instancePath+"/motion/intensity",schemaPath:"#/properties/motion/properties/intensity/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
if(data43.parallax !== undefined){
let data45 = data43.parallax;
if((typeof data45 == "number") && (isFinite(data45))){
if(data45 > 30 || isNaN(data45)){
const err121 = {instancePath:instancePath+"/motion/parallax",schemaPath:"#/properties/motion/properties/parallax/maximum",keyword:"maximum",params:{comparison: "<=", limit: 30},message:"must be <= 30"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
if(data45 < 0 || isNaN(data45)){
const err122 = {instancePath:instancePath+"/motion/parallax",schemaPath:"#/properties/motion/properties/parallax/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
else {
const err123 = {instancePath:instancePath+"/motion/parallax",schemaPath:"#/properties/motion/properties/parallax/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
}
if(data43.targetFps !== undefined){
let data46 = data43.targetFps;
if(!(((data46 === 24) || (data46 === 30)) || (data46 === 60))){
const err124 = {instancePath:instancePath+"/motion/targetFps",schemaPath:"#/properties/motion/properties/targetFps/enum",keyword:"enum",params:{allowedValues: schema33.properties.motion.properties.targetFps.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
}
}
else {
const err125 = {instancePath:instancePath+"/motion",schemaPath:"#/properties/motion/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
}
}
else {
const err126 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema61 = {"type":"object","additionalProperties":false,"required":["id","type","opacity","blendMode","parallax"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"type":{"enum":["image","gradient","vignette"]},"asset":{"$ref":"#/$defs/assetPath"},"opacity":{"type":"number","minimum":0,"maximum":1},"blendMode":{"enum":["normal","multiply","screen","overlay","soft-light"]},"parallax":{"type":"number","minimum":-30,"maximum":30}}};
const pattern36 = new RegExp("^[a-z0-9][a-z0-9-]{1,39}$", "u");

function validate24(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate24.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.type === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.opacity === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "opacity"},message:"must have required property '"+"opacity"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.blendMode === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "blendMode"},message:"must have required property '"+"blendMode"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.parallax === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "parallax"},message:"must have required property '"+"parallax"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!((((((key0 === "id") || (key0 === "type")) || (key0 === "asset")) || (key0 === "opacity")) || (key0 === "blendMode")) || (key0 === "parallax"))){
const err5 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(!pattern36.test(data0)){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
else {
const err7 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.type !== undefined){
let data1 = data.type;
if(!(((data1 === "image") || (data1 === "gradient")) || (data1 === "vignette"))){
const err8 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/enum",keyword:"enum",params:{allowedValues: schema61.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.asset !== undefined){
let data2 = data.asset;
if(typeof data2 === "string"){
if(func2(data2) > 180){
const err9 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(!pattern6.test(data2)){
const err10 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
else {
const err11 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.opacity !== undefined){
let data3 = data.opacity;
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 1 || isNaN(data3)){
const err12 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err13 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.blendMode !== undefined){
let data4 = data.blendMode;
if(!(((((data4 === "normal") || (data4 === "multiply")) || (data4 === "screen")) || (data4 === "overlay")) || (data4 === "soft-light"))){
const err15 = {instancePath:instancePath+"/blendMode",schemaPath:"#/properties/blendMode/enum",keyword:"enum",params:{allowedValues: schema61.properties.blendMode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.parallax !== undefined){
let data5 = data.parallax;
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 30 || isNaN(data5)){
const err16 = {instancePath:instancePath+"/parallax",schemaPath:"#/properties/parallax/maximum",keyword:"maximum",params:{comparison: "<=", limit: 30},message:"must be <= 30"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data5 < -30 || isNaN(data5)){
const err17 = {instancePath:instancePath+"/parallax",schemaPath:"#/properties/parallax/minimum",keyword:"minimum",params:{comparison: ">=", limit: -30},message:"must be >= -30"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
else {
const err18 = {instancePath:instancePath+"/parallax",schemaPath:"#/properties/parallax/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
}
else {
const err19 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
validate24.errors = vErrors;
return errors === 0;
}
validate24.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema63 = {"type":"object","additionalProperties":false,"required":["id","name","renderer","behaviors","anchor","size","opacity"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"name":{"type":"string","minLength":1,"maxLength":64},"renderer":{"oneOf":[{"type":"object","additionalProperties":false,"required":["type","asset"],"properties":{"type":{"const":"image"},"asset":{"$ref":"#/$defs/assetPath"},"normalization":{"enum":["preserve","grounded"]},"alphaThreshold":{"type":"integer","minimum":0,"maximum":255}}},{"type":"object","additionalProperties":false,"required":["type","asset","columns","rows","frameWidth","frameHeight","directions"],"properties":{"type":{"const":"sprite-atlas"},"asset":{"$ref":"#/$defs/assetPath"},"pages":{"type":"array","minItems":1,"maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/assetPath"}},"columns":{"type":"integer","minimum":1,"maximum":16},"rows":{"type":"integer","minimum":1,"maximum":16},"framesPerPage":{"type":"integer","minimum":1,"maximum":256},"frameWidth":{"type":"integer","minimum":16,"maximum":1024},"frameHeight":{"type":"integer","minimum":16,"maximum":1024},"directions":{"type":"integer","minimum":4,"maximum":512},"frameCount":{"type":"integer","minimum":1,"maximum":512},"frameAngles":{"type":"array","minItems":4,"maxItems":512,"items":{"type":"number","minimum":0,"maximum":360}},"poses":{"type":"array","minItems":4,"maxItems":512,"items":{"$ref":"#/$defs/companionPose"}},"idleClips":{"type":"array","maxItems":64,"items":{"$ref":"#/$defs/idleClip"}},"neutralFrame":{"type":"integer","minimum":0,"maximum":511},"reducedMotionFrame":{"type":"integer","minimum":0,"maximum":511},"transitionFps":{"type":"integer","minimum":12,"maximum":60},"followSmoothing":{"type":"number","minimum":0.02,"maximum":1},"normalization":{"enum":["preserve","grounded"]},"alphaThreshold":{"type":"integer","minimum":0,"maximum":255}}}]},"behaviors":{"type":"array","uniqueItems":true,"items":{"enum":["idle","parallax","look-at-pointer","reduce-motion-fallback"]}},"anchor":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":0,"maximum":100},"y":{"type":"number","minimum":0,"maximum":100}}},"attachment":{"type":"object","additionalProperties":false,"required":["target","edge","align","offset"],"properties":{"target":{"enum":["composer","main-surface","thread-summary"]},"edge":{"enum":["top","bottom"]},"align":{"type":"number","minimum":0,"maximum":1},"offset":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":-512,"maximum":512},"y":{"type":"number","minimum":-512,"maximum":512}}}}},"size":{"type":"number","minimum":24,"maximum":512},"opacity":{"type":"number","minimum":0,"maximum":1}}};
const schema67 = {"type":"object","additionalProperties":false,"required":["id","angle","frame"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"angle":{"type":"number","minimum":0,"exclusiveMaximum":360},"frame":{"type":"integer","minimum":0,"maximum":511}}};
const schema68 = {"type":"object","additionalProperties":false,"required":["id","poseIds","frames","minimumDelayMs","maximumDelayMs"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"poseIds":{"type":"array","minItems":1,"maxItems":512,"uniqueItems":true,"items":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"}},"frames":{"type":"array","minItems":1,"maxItems":120,"items":{"type":"object","additionalProperties":false,"required":["frame","durationMs"],"properties":{"frame":{"type":"integer","minimum":0,"maximum":511},"durationMs":{"type":"integer","minimum":16,"maximum":5000}}}},"minimumDelayMs":{"type":"integer","minimum":250,"maximum":120000},"maximumDelayMs":{"type":"integer","minimum":250,"maximum":120000}}};
const func0 = deepEqual;

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate26.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.name === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.renderer === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "renderer"},message:"must have required property '"+"renderer"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.behaviors === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "behaviors"},message:"must have required property '"+"behaviors"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.anchor === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "anchor"},message:"must have required property '"+"anchor"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.size === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "size"},message:"must have required property '"+"size"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.opacity === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "opacity"},message:"must have required property '"+"opacity"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "id") || (key0 === "name")) || (key0 === "renderer")) || (key0 === "behaviors")) || (key0 === "anchor")) || (key0 === "attachment")) || (key0 === "size")) || (key0 === "opacity"))){
const err7 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(!pattern36.test(data0)){
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.name !== undefined){
let data1 = data.name;
if(typeof data1 === "string"){
if(func2(data1) > 64){
const err10 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func2(data1) < 1){
const err11 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.renderer !== undefined){
let data2 = data.renderer;
const _errs7 = errors;
let valid1 = false;
let passing0 = null;
const _errs8 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err13 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data2.asset === undefined){
const err14 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/0/required",keyword:"required",params:{missingProperty: "asset"},message:"must have required property '"+"asset"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
for(const key1 in data2){
if(!((((key1 === "type") || (key1 === "asset")) || (key1 === "normalization")) || (key1 === "alphaThreshold"))){
const err15 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data2.type !== undefined){
if("image" !== data2.type){
const err16 = {instancePath:instancePath+"/renderer/type",schemaPath:"#/properties/renderer/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "image"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
if(data2.asset !== undefined){
let data4 = data2.asset;
if(typeof data4 === "string"){
if(func2(data4) > 180){
const err17 = {instancePath:instancePath+"/renderer/asset",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(!pattern6.test(data4)){
const err18 = {instancePath:instancePath+"/renderer/asset",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
else {
const err19 = {instancePath:instancePath+"/renderer/asset",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data2.normalization !== undefined){
let data5 = data2.normalization;
if(!((data5 === "preserve") || (data5 === "grounded"))){
const err20 = {instancePath:instancePath+"/renderer/normalization",schemaPath:"#/properties/renderer/oneOf/0/properties/normalization/enum",keyword:"enum",params:{allowedValues: schema63.properties.renderer.oneOf[0].properties.normalization.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data2.alphaThreshold !== undefined){
let data6 = data2.alphaThreshold;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err21 = {instancePath:instancePath+"/renderer/alphaThreshold",schemaPath:"#/properties/renderer/oneOf/0/properties/alphaThreshold/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 > 255 || isNaN(data6)){
const err22 = {instancePath:instancePath+"/renderer/alphaThreshold",schemaPath:"#/properties/renderer/oneOf/0/properties/alphaThreshold/maximum",keyword:"maximum",params:{comparison: "<=", limit: 255},message:"must be <= 255"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data6 < 0 || isNaN(data6)){
const err23 = {instancePath:instancePath+"/renderer/alphaThreshold",schemaPath:"#/properties/renderer/oneOf/0/properties/alphaThreshold/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
}
}
else {
const err24 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
var _valid0 = _errs8 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
var props0 = true;
}
const _errs18 = errors;
if(data2 && typeof data2 == "object" && !Array.isArray(data2)){
if(data2.type === undefined){
const err25 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data2.asset === undefined){
const err26 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/required",keyword:"required",params:{missingProperty: "asset"},message:"must have required property '"+"asset"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data2.columns === undefined){
const err27 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/required",keyword:"required",params:{missingProperty: "columns"},message:"must have required property '"+"columns"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data2.rows === undefined){
const err28 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/required",keyword:"required",params:{missingProperty: "rows"},message:"must have required property '"+"rows"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data2.frameWidth === undefined){
const err29 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/required",keyword:"required",params:{missingProperty: "frameWidth"},message:"must have required property '"+"frameWidth"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(data2.frameHeight === undefined){
const err30 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/required",keyword:"required",params:{missingProperty: "frameHeight"},message:"must have required property '"+"frameHeight"+"'"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data2.directions === undefined){
const err31 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/required",keyword:"required",params:{missingProperty: "directions"},message:"must have required property '"+"directions"+"'"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
for(const key2 in data2){
if(!(func1.call(schema63.properties.renderer.oneOf[1].properties, key2))){
const err32 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data2.type !== undefined){
if("sprite-atlas" !== data2.type){
const err33 = {instancePath:instancePath+"/renderer/type",schemaPath:"#/properties/renderer/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "sprite-atlas"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
if(data2.asset !== undefined){
let data8 = data2.asset;
if(typeof data8 === "string"){
if(func2(data8) > 180){
const err34 = {instancePath:instancePath+"/renderer/asset",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(!pattern6.test(data8)){
const err35 = {instancePath:instancePath+"/renderer/asset",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
else {
const err36 = {instancePath:instancePath+"/renderer/asset",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data2.pages !== undefined){
let data9 = data2.pages;
if(Array.isArray(data9)){
if(data9.length > 8){
const err37 = {instancePath:instancePath+"/renderer/pages",schemaPath:"#/properties/renderer/oneOf/1/properties/pages/maxItems",keyword:"maxItems",params:{limit: 8},message:"must NOT have more than 8 items"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
if(data9.length < 1){
const err38 = {instancePath:instancePath+"/renderer/pages",schemaPath:"#/properties/renderer/oneOf/1/properties/pages/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
const len0 = data9.length;
for(let i0=0; i0<len0; i0++){
let data10 = data9[i0];
if(typeof data10 === "string"){
if(func2(data10) > 180){
const err39 = {instancePath:instancePath+"/renderer/pages/" + i0,schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(!pattern6.test(data10)){
const err40 = {instancePath:instancePath+"/renderer/pages/" + i0,schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
else {
const err41 = {instancePath:instancePath+"/renderer/pages/" + i0,schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
let i1 = data9.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data9[i1], data9[j0])){
const err42 = {instancePath:instancePath+"/renderer/pages",schemaPath:"#/properties/renderer/oneOf/1/properties/pages/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err43 = {instancePath:instancePath+"/renderer/pages",schemaPath:"#/properties/renderer/oneOf/1/properties/pages/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data2.columns !== undefined){
let data11 = data2.columns;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err44 = {instancePath:instancePath+"/renderer/columns",schemaPath:"#/properties/renderer/oneOf/1/properties/columns/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 > 16 || isNaN(data11)){
const err45 = {instancePath:instancePath+"/renderer/columns",schemaPath:"#/properties/renderer/oneOf/1/properties/columns/maximum",keyword:"maximum",params:{comparison: "<=", limit: 16},message:"must be <= 16"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data11 < 1 || isNaN(data11)){
const err46 = {instancePath:instancePath+"/renderer/columns",schemaPath:"#/properties/renderer/oneOf/1/properties/columns/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
if(data2.rows !== undefined){
let data12 = data2.rows;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err47 = {instancePath:instancePath+"/renderer/rows",schemaPath:"#/properties/renderer/oneOf/1/properties/rows/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 > 16 || isNaN(data12)){
const err48 = {instancePath:instancePath+"/renderer/rows",schemaPath:"#/properties/renderer/oneOf/1/properties/rows/maximum",keyword:"maximum",params:{comparison: "<=", limit: 16},message:"must be <= 16"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data12 < 1 || isNaN(data12)){
const err49 = {instancePath:instancePath+"/renderer/rows",schemaPath:"#/properties/renderer/oneOf/1/properties/rows/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
}
if(data2.framesPerPage !== undefined){
let data13 = data2.framesPerPage;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err50 = {instancePath:instancePath+"/renderer/framesPerPage",schemaPath:"#/properties/renderer/oneOf/1/properties/framesPerPage/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 256 || isNaN(data13)){
const err51 = {instancePath:instancePath+"/renderer/framesPerPage",schemaPath:"#/properties/renderer/oneOf/1/properties/framesPerPage/maximum",keyword:"maximum",params:{comparison: "<=", limit: 256},message:"must be <= 256"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(data13 < 1 || isNaN(data13)){
const err52 = {instancePath:instancePath+"/renderer/framesPerPage",schemaPath:"#/properties/renderer/oneOf/1/properties/framesPerPage/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
}
if(data2.frameWidth !== undefined){
let data14 = data2.frameWidth;
if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
const err53 = {instancePath:instancePath+"/renderer/frameWidth",schemaPath:"#/properties/renderer/oneOf/1/properties/frameWidth/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 > 1024 || isNaN(data14)){
const err54 = {instancePath:instancePath+"/renderer/frameWidth",schemaPath:"#/properties/renderer/oneOf/1/properties/frameWidth/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1024},message:"must be <= 1024"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data14 < 16 || isNaN(data14)){
const err55 = {instancePath:instancePath+"/renderer/frameWidth",schemaPath:"#/properties/renderer/oneOf/1/properties/frameWidth/minimum",keyword:"minimum",params:{comparison: ">=", limit: 16},message:"must be >= 16"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
}
if(data2.frameHeight !== undefined){
let data15 = data2.frameHeight;
if(!(((typeof data15 == "number") && (!(data15 % 1) && !isNaN(data15))) && (isFinite(data15)))){
const err56 = {instancePath:instancePath+"/renderer/frameHeight",schemaPath:"#/properties/renderer/oneOf/1/properties/frameHeight/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if((typeof data15 == "number") && (isFinite(data15))){
if(data15 > 1024 || isNaN(data15)){
const err57 = {instancePath:instancePath+"/renderer/frameHeight",schemaPath:"#/properties/renderer/oneOf/1/properties/frameHeight/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1024},message:"must be <= 1024"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(data15 < 16 || isNaN(data15)){
const err58 = {instancePath:instancePath+"/renderer/frameHeight",schemaPath:"#/properties/renderer/oneOf/1/properties/frameHeight/minimum",keyword:"minimum",params:{comparison: ">=", limit: 16},message:"must be >= 16"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
}
if(data2.directions !== undefined){
let data16 = data2.directions;
if(!(((typeof data16 == "number") && (!(data16 % 1) && !isNaN(data16))) && (isFinite(data16)))){
const err59 = {instancePath:instancePath+"/renderer/directions",schemaPath:"#/properties/renderer/oneOf/1/properties/directions/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if((typeof data16 == "number") && (isFinite(data16))){
if(data16 > 512 || isNaN(data16)){
const err60 = {instancePath:instancePath+"/renderer/directions",schemaPath:"#/properties/renderer/oneOf/1/properties/directions/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
if(data16 < 4 || isNaN(data16)){
const err61 = {instancePath:instancePath+"/renderer/directions",schemaPath:"#/properties/renderer/oneOf/1/properties/directions/minimum",keyword:"minimum",params:{comparison: ">=", limit: 4},message:"must be >= 4"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
}
if(data2.frameCount !== undefined){
let data17 = data2.frameCount;
if(!(((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17))) && (isFinite(data17)))){
const err62 = {instancePath:instancePath+"/renderer/frameCount",schemaPath:"#/properties/renderer/oneOf/1/properties/frameCount/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if((typeof data17 == "number") && (isFinite(data17))){
if(data17 > 512 || isNaN(data17)){
const err63 = {instancePath:instancePath+"/renderer/frameCount",schemaPath:"#/properties/renderer/oneOf/1/properties/frameCount/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(data17 < 1 || isNaN(data17)){
const err64 = {instancePath:instancePath+"/renderer/frameCount",schemaPath:"#/properties/renderer/oneOf/1/properties/frameCount/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
}
if(data2.frameAngles !== undefined){
let data18 = data2.frameAngles;
if(Array.isArray(data18)){
if(data18.length > 512){
const err65 = {instancePath:instancePath+"/renderer/frameAngles",schemaPath:"#/properties/renderer/oneOf/1/properties/frameAngles/maxItems",keyword:"maxItems",params:{limit: 512},message:"must NOT have more than 512 items"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data18.length < 4){
const err66 = {instancePath:instancePath+"/renderer/frameAngles",schemaPath:"#/properties/renderer/oneOf/1/properties/frameAngles/minItems",keyword:"minItems",params:{limit: 4},message:"must NOT have fewer than 4 items"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
const len1 = data18.length;
for(let i2=0; i2<len1; i2++){
let data19 = data18[i2];
if((typeof data19 == "number") && (isFinite(data19))){
if(data19 > 360 || isNaN(data19)){
const err67 = {instancePath:instancePath+"/renderer/frameAngles/" + i2,schemaPath:"#/properties/renderer/oneOf/1/properties/frameAngles/items/maximum",keyword:"maximum",params:{comparison: "<=", limit: 360},message:"must be <= 360"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data19 < 0 || isNaN(data19)){
const err68 = {instancePath:instancePath+"/renderer/frameAngles/" + i2,schemaPath:"#/properties/renderer/oneOf/1/properties/frameAngles/items/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
else {
const err69 = {instancePath:instancePath+"/renderer/frameAngles/" + i2,schemaPath:"#/properties/renderer/oneOf/1/properties/frameAngles/items/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
}
else {
const err70 = {instancePath:instancePath+"/renderer/frameAngles",schemaPath:"#/properties/renderer/oneOf/1/properties/frameAngles/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data2.poses !== undefined){
let data20 = data2.poses;
if(Array.isArray(data20)){
if(data20.length > 512){
const err71 = {instancePath:instancePath+"/renderer/poses",schemaPath:"#/properties/renderer/oneOf/1/properties/poses/maxItems",keyword:"maxItems",params:{limit: 512},message:"must NOT have more than 512 items"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(data20.length < 4){
const err72 = {instancePath:instancePath+"/renderer/poses",schemaPath:"#/properties/renderer/oneOf/1/properties/poses/minItems",keyword:"minItems",params:{limit: 4},message:"must NOT have fewer than 4 items"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
const len2 = data20.length;
for(let i3=0; i3<len2; i3++){
let data21 = data20[i3];
if(data21 && typeof data21 == "object" && !Array.isArray(data21)){
if(data21.id === undefined){
const err73 = {instancePath:instancePath+"/renderer/poses/" + i3,schemaPath:"#/$defs/companionPose/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
if(data21.angle === undefined){
const err74 = {instancePath:instancePath+"/renderer/poses/" + i3,schemaPath:"#/$defs/companionPose/required",keyword:"required",params:{missingProperty: "angle"},message:"must have required property '"+"angle"+"'"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if(data21.frame === undefined){
const err75 = {instancePath:instancePath+"/renderer/poses/" + i3,schemaPath:"#/$defs/companionPose/required",keyword:"required",params:{missingProperty: "frame"},message:"must have required property '"+"frame"+"'"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
for(const key3 in data21){
if(!(((key3 === "id") || (key3 === "angle")) || (key3 === "frame"))){
const err76 = {instancePath:instancePath+"/renderer/poses/" + i3,schemaPath:"#/$defs/companionPose/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
if(data21.id !== undefined){
let data22 = data21.id;
if(typeof data22 === "string"){
if(!pattern36.test(data22)){
const err77 = {instancePath:instancePath+"/renderer/poses/" + i3+"/id",schemaPath:"#/$defs/companionPose/properties/id/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
else {
const err78 = {instancePath:instancePath+"/renderer/poses/" + i3+"/id",schemaPath:"#/$defs/companionPose/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data21.angle !== undefined){
let data23 = data21.angle;
if((typeof data23 == "number") && (isFinite(data23))){
if(data23 < 0 || isNaN(data23)){
const err79 = {instancePath:instancePath+"/renderer/poses/" + i3+"/angle",schemaPath:"#/$defs/companionPose/properties/angle/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
if(data23 >= 360 || isNaN(data23)){
const err80 = {instancePath:instancePath+"/renderer/poses/" + i3+"/angle",schemaPath:"#/$defs/companionPose/properties/angle/exclusiveMaximum",keyword:"exclusiveMaximum",params:{comparison: "<", limit: 360},message:"must be < 360"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
else {
const err81 = {instancePath:instancePath+"/renderer/poses/" + i3+"/angle",schemaPath:"#/$defs/companionPose/properties/angle/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
}
if(data21.frame !== undefined){
let data24 = data21.frame;
if(!(((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24))) && (isFinite(data24)))){
const err82 = {instancePath:instancePath+"/renderer/poses/" + i3+"/frame",schemaPath:"#/$defs/companionPose/properties/frame/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
if((typeof data24 == "number") && (isFinite(data24))){
if(data24 > 511 || isNaN(data24)){
const err83 = {instancePath:instancePath+"/renderer/poses/" + i3+"/frame",schemaPath:"#/$defs/companionPose/properties/frame/maximum",keyword:"maximum",params:{comparison: "<=", limit: 511},message:"must be <= 511"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
if(data24 < 0 || isNaN(data24)){
const err84 = {instancePath:instancePath+"/renderer/poses/" + i3+"/frame",schemaPath:"#/$defs/companionPose/properties/frame/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
}
}
}
else {
const err85 = {instancePath:instancePath+"/renderer/poses/" + i3,schemaPath:"#/$defs/companionPose/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
}
else {
const err86 = {instancePath:instancePath+"/renderer/poses",schemaPath:"#/properties/renderer/oneOf/1/properties/poses/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data2.idleClips !== undefined){
let data25 = data2.idleClips;
if(Array.isArray(data25)){
if(data25.length > 64){
const err87 = {instancePath:instancePath+"/renderer/idleClips",schemaPath:"#/properties/renderer/oneOf/1/properties/idleClips/maxItems",keyword:"maxItems",params:{limit: 64},message:"must NOT have more than 64 items"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
const len3 = data25.length;
for(let i4=0; i4<len3; i4++){
let data26 = data25[i4];
if(data26 && typeof data26 == "object" && !Array.isArray(data26)){
if(data26.id === undefined){
const err88 = {instancePath:instancePath+"/renderer/idleClips/" + i4,schemaPath:"#/$defs/idleClip/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
if(data26.poseIds === undefined){
const err89 = {instancePath:instancePath+"/renderer/idleClips/" + i4,schemaPath:"#/$defs/idleClip/required",keyword:"required",params:{missingProperty: "poseIds"},message:"must have required property '"+"poseIds"+"'"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
if(data26.frames === undefined){
const err90 = {instancePath:instancePath+"/renderer/idleClips/" + i4,schemaPath:"#/$defs/idleClip/required",keyword:"required",params:{missingProperty: "frames"},message:"must have required property '"+"frames"+"'"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
if(data26.minimumDelayMs === undefined){
const err91 = {instancePath:instancePath+"/renderer/idleClips/" + i4,schemaPath:"#/$defs/idleClip/required",keyword:"required",params:{missingProperty: "minimumDelayMs"},message:"must have required property '"+"minimumDelayMs"+"'"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
if(data26.maximumDelayMs === undefined){
const err92 = {instancePath:instancePath+"/renderer/idleClips/" + i4,schemaPath:"#/$defs/idleClip/required",keyword:"required",params:{missingProperty: "maximumDelayMs"},message:"must have required property '"+"maximumDelayMs"+"'"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
for(const key4 in data26){
if(!(((((key4 === "id") || (key4 === "poseIds")) || (key4 === "frames")) || (key4 === "minimumDelayMs")) || (key4 === "maximumDelayMs"))){
const err93 = {instancePath:instancePath+"/renderer/idleClips/" + i4,schemaPath:"#/$defs/idleClip/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err93];
}
else {
vErrors.push(err93);
}
errors++;
}
}
if(data26.id !== undefined){
let data27 = data26.id;
if(typeof data27 === "string"){
if(!pattern36.test(data27)){
const err94 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/id",schemaPath:"#/$defs/idleClip/properties/id/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
if(vErrors === null){
vErrors = [err94];
}
else {
vErrors.push(err94);
}
errors++;
}
}
else {
const err95 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/id",schemaPath:"#/$defs/idleClip/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err95];
}
else {
vErrors.push(err95);
}
errors++;
}
}
if(data26.poseIds !== undefined){
let data28 = data26.poseIds;
if(Array.isArray(data28)){
if(data28.length > 512){
const err96 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/poseIds",schemaPath:"#/$defs/idleClip/properties/poseIds/maxItems",keyword:"maxItems",params:{limit: 512},message:"must NOT have more than 512 items"};
if(vErrors === null){
vErrors = [err96];
}
else {
vErrors.push(err96);
}
errors++;
}
if(data28.length < 1){
const err97 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/poseIds",schemaPath:"#/$defs/idleClip/properties/poseIds/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err97];
}
else {
vErrors.push(err97);
}
errors++;
}
const len4 = data28.length;
for(let i5=0; i5<len4; i5++){
let data29 = data28[i5];
if(typeof data29 === "string"){
if(!pattern36.test(data29)){
const err98 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/poseIds/" + i5,schemaPath:"#/$defs/idleClip/properties/poseIds/items/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
if(vErrors === null){
vErrors = [err98];
}
else {
vErrors.push(err98);
}
errors++;
}
}
else {
const err99 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/poseIds/" + i5,schemaPath:"#/$defs/idleClip/properties/poseIds/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err99];
}
else {
vErrors.push(err99);
}
errors++;
}
}
let i6 = data28.length;
let j1;
if(i6 > 1){
const indices0 = {};
for(;i6--;){
let item0 = data28[i6];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j1 = indices0[item0];
const err100 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/poseIds",schemaPath:"#/$defs/idleClip/properties/poseIds/uniqueItems",keyword:"uniqueItems",params:{i: i6, j: j1},message:"must NOT have duplicate items (items ## "+j1+" and "+i6+" are identical)"};
if(vErrors === null){
vErrors = [err100];
}
else {
vErrors.push(err100);
}
errors++;
break;
}
indices0[item0] = i6;
}
}
}
else {
const err101 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/poseIds",schemaPath:"#/$defs/idleClip/properties/poseIds/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err101];
}
else {
vErrors.push(err101);
}
errors++;
}
}
if(data26.frames !== undefined){
let data30 = data26.frames;
if(Array.isArray(data30)){
if(data30.length > 120){
const err102 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames",schemaPath:"#/$defs/idleClip/properties/frames/maxItems",keyword:"maxItems",params:{limit: 120},message:"must NOT have more than 120 items"};
if(vErrors === null){
vErrors = [err102];
}
else {
vErrors.push(err102);
}
errors++;
}
if(data30.length < 1){
const err103 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames",schemaPath:"#/$defs/idleClip/properties/frames/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err103];
}
else {
vErrors.push(err103);
}
errors++;
}
const len5 = data30.length;
for(let i7=0; i7<len5; i7++){
let data31 = data30[i7];
if(data31 && typeof data31 == "object" && !Array.isArray(data31)){
if(data31.frame === undefined){
const err104 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7,schemaPath:"#/$defs/idleClip/properties/frames/items/required",keyword:"required",params:{missingProperty: "frame"},message:"must have required property '"+"frame"+"'"};
if(vErrors === null){
vErrors = [err104];
}
else {
vErrors.push(err104);
}
errors++;
}
if(data31.durationMs === undefined){
const err105 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7,schemaPath:"#/$defs/idleClip/properties/frames/items/required",keyword:"required",params:{missingProperty: "durationMs"},message:"must have required property '"+"durationMs"+"'"};
if(vErrors === null){
vErrors = [err105];
}
else {
vErrors.push(err105);
}
errors++;
}
for(const key5 in data31){
if(!((key5 === "frame") || (key5 === "durationMs"))){
const err106 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7,schemaPath:"#/$defs/idleClip/properties/frames/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err106];
}
else {
vErrors.push(err106);
}
errors++;
}
}
if(data31.frame !== undefined){
let data32 = data31.frame;
if(!(((typeof data32 == "number") && (!(data32 % 1) && !isNaN(data32))) && (isFinite(data32)))){
const err107 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7+"/frame",schemaPath:"#/$defs/idleClip/properties/frames/items/properties/frame/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err107];
}
else {
vErrors.push(err107);
}
errors++;
}
if((typeof data32 == "number") && (isFinite(data32))){
if(data32 > 511 || isNaN(data32)){
const err108 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7+"/frame",schemaPath:"#/$defs/idleClip/properties/frames/items/properties/frame/maximum",keyword:"maximum",params:{comparison: "<=", limit: 511},message:"must be <= 511"};
if(vErrors === null){
vErrors = [err108];
}
else {
vErrors.push(err108);
}
errors++;
}
if(data32 < 0 || isNaN(data32)){
const err109 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7+"/frame",schemaPath:"#/$defs/idleClip/properties/frames/items/properties/frame/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err109];
}
else {
vErrors.push(err109);
}
errors++;
}
}
}
if(data31.durationMs !== undefined){
let data33 = data31.durationMs;
if(!(((typeof data33 == "number") && (!(data33 % 1) && !isNaN(data33))) && (isFinite(data33)))){
const err110 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7+"/durationMs",schemaPath:"#/$defs/idleClip/properties/frames/items/properties/durationMs/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err110];
}
else {
vErrors.push(err110);
}
errors++;
}
if((typeof data33 == "number") && (isFinite(data33))){
if(data33 > 5000 || isNaN(data33)){
const err111 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7+"/durationMs",schemaPath:"#/$defs/idleClip/properties/frames/items/properties/durationMs/maximum",keyword:"maximum",params:{comparison: "<=", limit: 5000},message:"must be <= 5000"};
if(vErrors === null){
vErrors = [err111];
}
else {
vErrors.push(err111);
}
errors++;
}
if(data33 < 16 || isNaN(data33)){
const err112 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7+"/durationMs",schemaPath:"#/$defs/idleClip/properties/frames/items/properties/durationMs/minimum",keyword:"minimum",params:{comparison: ">=", limit: 16},message:"must be >= 16"};
if(vErrors === null){
vErrors = [err112];
}
else {
vErrors.push(err112);
}
errors++;
}
}
}
}
else {
const err113 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames/" + i7,schemaPath:"#/$defs/idleClip/properties/frames/items/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err113];
}
else {
vErrors.push(err113);
}
errors++;
}
}
}
else {
const err114 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/frames",schemaPath:"#/$defs/idleClip/properties/frames/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err114];
}
else {
vErrors.push(err114);
}
errors++;
}
}
if(data26.minimumDelayMs !== undefined){
let data34 = data26.minimumDelayMs;
if(!(((typeof data34 == "number") && (!(data34 % 1) && !isNaN(data34))) && (isFinite(data34)))){
const err115 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/minimumDelayMs",schemaPath:"#/$defs/idleClip/properties/minimumDelayMs/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err115];
}
else {
vErrors.push(err115);
}
errors++;
}
if((typeof data34 == "number") && (isFinite(data34))){
if(data34 > 120000 || isNaN(data34)){
const err116 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/minimumDelayMs",schemaPath:"#/$defs/idleClip/properties/minimumDelayMs/maximum",keyword:"maximum",params:{comparison: "<=", limit: 120000},message:"must be <= 120000"};
if(vErrors === null){
vErrors = [err116];
}
else {
vErrors.push(err116);
}
errors++;
}
if(data34 < 250 || isNaN(data34)){
const err117 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/minimumDelayMs",schemaPath:"#/$defs/idleClip/properties/minimumDelayMs/minimum",keyword:"minimum",params:{comparison: ">=", limit: 250},message:"must be >= 250"};
if(vErrors === null){
vErrors = [err117];
}
else {
vErrors.push(err117);
}
errors++;
}
}
}
if(data26.maximumDelayMs !== undefined){
let data35 = data26.maximumDelayMs;
if(!(((typeof data35 == "number") && (!(data35 % 1) && !isNaN(data35))) && (isFinite(data35)))){
const err118 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/maximumDelayMs",schemaPath:"#/$defs/idleClip/properties/maximumDelayMs/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err118];
}
else {
vErrors.push(err118);
}
errors++;
}
if((typeof data35 == "number") && (isFinite(data35))){
if(data35 > 120000 || isNaN(data35)){
const err119 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/maximumDelayMs",schemaPath:"#/$defs/idleClip/properties/maximumDelayMs/maximum",keyword:"maximum",params:{comparison: "<=", limit: 120000},message:"must be <= 120000"};
if(vErrors === null){
vErrors = [err119];
}
else {
vErrors.push(err119);
}
errors++;
}
if(data35 < 250 || isNaN(data35)){
const err120 = {instancePath:instancePath+"/renderer/idleClips/" + i4+"/maximumDelayMs",schemaPath:"#/$defs/idleClip/properties/maximumDelayMs/minimum",keyword:"minimum",params:{comparison: ">=", limit: 250},message:"must be >= 250"};
if(vErrors === null){
vErrors = [err120];
}
else {
vErrors.push(err120);
}
errors++;
}
}
}
}
else {
const err121 = {instancePath:instancePath+"/renderer/idleClips/" + i4,schemaPath:"#/$defs/idleClip/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err121];
}
else {
vErrors.push(err121);
}
errors++;
}
}
}
else {
const err122 = {instancePath:instancePath+"/renderer/idleClips",schemaPath:"#/properties/renderer/oneOf/1/properties/idleClips/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err122];
}
else {
vErrors.push(err122);
}
errors++;
}
}
if(data2.neutralFrame !== undefined){
let data36 = data2.neutralFrame;
if(!(((typeof data36 == "number") && (!(data36 % 1) && !isNaN(data36))) && (isFinite(data36)))){
const err123 = {instancePath:instancePath+"/renderer/neutralFrame",schemaPath:"#/properties/renderer/oneOf/1/properties/neutralFrame/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err123];
}
else {
vErrors.push(err123);
}
errors++;
}
if((typeof data36 == "number") && (isFinite(data36))){
if(data36 > 511 || isNaN(data36)){
const err124 = {instancePath:instancePath+"/renderer/neutralFrame",schemaPath:"#/properties/renderer/oneOf/1/properties/neutralFrame/maximum",keyword:"maximum",params:{comparison: "<=", limit: 511},message:"must be <= 511"};
if(vErrors === null){
vErrors = [err124];
}
else {
vErrors.push(err124);
}
errors++;
}
if(data36 < 0 || isNaN(data36)){
const err125 = {instancePath:instancePath+"/renderer/neutralFrame",schemaPath:"#/properties/renderer/oneOf/1/properties/neutralFrame/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err125];
}
else {
vErrors.push(err125);
}
errors++;
}
}
}
if(data2.reducedMotionFrame !== undefined){
let data37 = data2.reducedMotionFrame;
if(!(((typeof data37 == "number") && (!(data37 % 1) && !isNaN(data37))) && (isFinite(data37)))){
const err126 = {instancePath:instancePath+"/renderer/reducedMotionFrame",schemaPath:"#/properties/renderer/oneOf/1/properties/reducedMotionFrame/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err126];
}
else {
vErrors.push(err126);
}
errors++;
}
if((typeof data37 == "number") && (isFinite(data37))){
if(data37 > 511 || isNaN(data37)){
const err127 = {instancePath:instancePath+"/renderer/reducedMotionFrame",schemaPath:"#/properties/renderer/oneOf/1/properties/reducedMotionFrame/maximum",keyword:"maximum",params:{comparison: "<=", limit: 511},message:"must be <= 511"};
if(vErrors === null){
vErrors = [err127];
}
else {
vErrors.push(err127);
}
errors++;
}
if(data37 < 0 || isNaN(data37)){
const err128 = {instancePath:instancePath+"/renderer/reducedMotionFrame",schemaPath:"#/properties/renderer/oneOf/1/properties/reducedMotionFrame/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err128];
}
else {
vErrors.push(err128);
}
errors++;
}
}
}
if(data2.transitionFps !== undefined){
let data38 = data2.transitionFps;
if(!(((typeof data38 == "number") && (!(data38 % 1) && !isNaN(data38))) && (isFinite(data38)))){
const err129 = {instancePath:instancePath+"/renderer/transitionFps",schemaPath:"#/properties/renderer/oneOf/1/properties/transitionFps/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err129];
}
else {
vErrors.push(err129);
}
errors++;
}
if((typeof data38 == "number") && (isFinite(data38))){
if(data38 > 60 || isNaN(data38)){
const err130 = {instancePath:instancePath+"/renderer/transitionFps",schemaPath:"#/properties/renderer/oneOf/1/properties/transitionFps/maximum",keyword:"maximum",params:{comparison: "<=", limit: 60},message:"must be <= 60"};
if(vErrors === null){
vErrors = [err130];
}
else {
vErrors.push(err130);
}
errors++;
}
if(data38 < 12 || isNaN(data38)){
const err131 = {instancePath:instancePath+"/renderer/transitionFps",schemaPath:"#/properties/renderer/oneOf/1/properties/transitionFps/minimum",keyword:"minimum",params:{comparison: ">=", limit: 12},message:"must be >= 12"};
if(vErrors === null){
vErrors = [err131];
}
else {
vErrors.push(err131);
}
errors++;
}
}
}
if(data2.followSmoothing !== undefined){
let data39 = data2.followSmoothing;
if((typeof data39 == "number") && (isFinite(data39))){
if(data39 > 1 || isNaN(data39)){
const err132 = {instancePath:instancePath+"/renderer/followSmoothing",schemaPath:"#/properties/renderer/oneOf/1/properties/followSmoothing/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err132];
}
else {
vErrors.push(err132);
}
errors++;
}
if(data39 < 0.02 || isNaN(data39)){
const err133 = {instancePath:instancePath+"/renderer/followSmoothing",schemaPath:"#/properties/renderer/oneOf/1/properties/followSmoothing/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0.02},message:"must be >= 0.02"};
if(vErrors === null){
vErrors = [err133];
}
else {
vErrors.push(err133);
}
errors++;
}
}
else {
const err134 = {instancePath:instancePath+"/renderer/followSmoothing",schemaPath:"#/properties/renderer/oneOf/1/properties/followSmoothing/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err134];
}
else {
vErrors.push(err134);
}
errors++;
}
}
if(data2.normalization !== undefined){
let data40 = data2.normalization;
if(!((data40 === "preserve") || (data40 === "grounded"))){
const err135 = {instancePath:instancePath+"/renderer/normalization",schemaPath:"#/properties/renderer/oneOf/1/properties/normalization/enum",keyword:"enum",params:{allowedValues: schema63.properties.renderer.oneOf[1].properties.normalization.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err135];
}
else {
vErrors.push(err135);
}
errors++;
}
}
if(data2.alphaThreshold !== undefined){
let data41 = data2.alphaThreshold;
if(!(((typeof data41 == "number") && (!(data41 % 1) && !isNaN(data41))) && (isFinite(data41)))){
const err136 = {instancePath:instancePath+"/renderer/alphaThreshold",schemaPath:"#/properties/renderer/oneOf/1/properties/alphaThreshold/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err136];
}
else {
vErrors.push(err136);
}
errors++;
}
if((typeof data41 == "number") && (isFinite(data41))){
if(data41 > 255 || isNaN(data41)){
const err137 = {instancePath:instancePath+"/renderer/alphaThreshold",schemaPath:"#/properties/renderer/oneOf/1/properties/alphaThreshold/maximum",keyword:"maximum",params:{comparison: "<=", limit: 255},message:"must be <= 255"};
if(vErrors === null){
vErrors = [err137];
}
else {
vErrors.push(err137);
}
errors++;
}
if(data41 < 0 || isNaN(data41)){
const err138 = {instancePath:instancePath+"/renderer/alphaThreshold",schemaPath:"#/properties/renderer/oneOf/1/properties/alphaThreshold/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err138];
}
else {
vErrors.push(err138);
}
errors++;
}
}
}
}
else {
const err139 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err139];
}
else {
vErrors.push(err139);
}
errors++;
}
var _valid0 = _errs18 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid1){
const err140 = {instancePath:instancePath+"/renderer",schemaPath:"#/properties/renderer/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err140];
}
else {
vErrors.push(err140);
}
errors++;
}
else {
errors = _errs7;
if(vErrors !== null){
if(_errs7){
vErrors.length = _errs7;
}
else {
vErrors = null;
}
}
}
}
if(data.behaviors !== undefined){
let data42 = data.behaviors;
if(Array.isArray(data42)){
const len6 = data42.length;
for(let i8=0; i8<len6; i8++){
let data43 = data42[i8];
if(!((((data43 === "idle") || (data43 === "parallax")) || (data43 === "look-at-pointer")) || (data43 === "reduce-motion-fallback"))){
const err141 = {instancePath:instancePath+"/behaviors/" + i8,schemaPath:"#/properties/behaviors/items/enum",keyword:"enum",params:{allowedValues: schema63.properties.behaviors.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err141];
}
else {
vErrors.push(err141);
}
errors++;
}
}
let i9 = data42.length;
let j2;
if(i9 > 1){
outer1:
for(;i9--;){
for(j2 = i9; j2--;){
if(func0(data42[i9], data42[j2])){
const err142 = {instancePath:instancePath+"/behaviors",schemaPath:"#/properties/behaviors/uniqueItems",keyword:"uniqueItems",params:{i: i9, j: j2},message:"must NOT have duplicate items (items ## "+j2+" and "+i9+" are identical)"};
if(vErrors === null){
vErrors = [err142];
}
else {
vErrors.push(err142);
}
errors++;
break outer1;
}
}
}
}
}
else {
const err143 = {instancePath:instancePath+"/behaviors",schemaPath:"#/properties/behaviors/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err143];
}
else {
vErrors.push(err143);
}
errors++;
}
}
if(data.anchor !== undefined){
let data44 = data.anchor;
if(data44 && typeof data44 == "object" && !Array.isArray(data44)){
if(data44.x === undefined){
const err144 = {instancePath:instancePath+"/anchor",schemaPath:"#/properties/anchor/required",keyword:"required",params:{missingProperty: "x"},message:"must have required property '"+"x"+"'"};
if(vErrors === null){
vErrors = [err144];
}
else {
vErrors.push(err144);
}
errors++;
}
if(data44.y === undefined){
const err145 = {instancePath:instancePath+"/anchor",schemaPath:"#/properties/anchor/required",keyword:"required",params:{missingProperty: "y"},message:"must have required property '"+"y"+"'"};
if(vErrors === null){
vErrors = [err145];
}
else {
vErrors.push(err145);
}
errors++;
}
for(const key6 in data44){
if(!((key6 === "x") || (key6 === "y"))){
const err146 = {instancePath:instancePath+"/anchor",schemaPath:"#/properties/anchor/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err146];
}
else {
vErrors.push(err146);
}
errors++;
}
}
if(data44.x !== undefined){
let data45 = data44.x;
if((typeof data45 == "number") && (isFinite(data45))){
if(data45 > 100 || isNaN(data45)){
const err147 = {instancePath:instancePath+"/anchor/x",schemaPath:"#/properties/anchor/properties/x/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err147];
}
else {
vErrors.push(err147);
}
errors++;
}
if(data45 < 0 || isNaN(data45)){
const err148 = {instancePath:instancePath+"/anchor/x",schemaPath:"#/properties/anchor/properties/x/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err148];
}
else {
vErrors.push(err148);
}
errors++;
}
}
else {
const err149 = {instancePath:instancePath+"/anchor/x",schemaPath:"#/properties/anchor/properties/x/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err149];
}
else {
vErrors.push(err149);
}
errors++;
}
}
if(data44.y !== undefined){
let data46 = data44.y;
if((typeof data46 == "number") && (isFinite(data46))){
if(data46 > 100 || isNaN(data46)){
const err150 = {instancePath:instancePath+"/anchor/y",schemaPath:"#/properties/anchor/properties/y/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err150];
}
else {
vErrors.push(err150);
}
errors++;
}
if(data46 < 0 || isNaN(data46)){
const err151 = {instancePath:instancePath+"/anchor/y",schemaPath:"#/properties/anchor/properties/y/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err151];
}
else {
vErrors.push(err151);
}
errors++;
}
}
else {
const err152 = {instancePath:instancePath+"/anchor/y",schemaPath:"#/properties/anchor/properties/y/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err152];
}
else {
vErrors.push(err152);
}
errors++;
}
}
}
else {
const err153 = {instancePath:instancePath+"/anchor",schemaPath:"#/properties/anchor/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err153];
}
else {
vErrors.push(err153);
}
errors++;
}
}
if(data.attachment !== undefined){
let data47 = data.attachment;
if(data47 && typeof data47 == "object" && !Array.isArray(data47)){
if(data47.target === undefined){
const err154 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/required",keyword:"required",params:{missingProperty: "target"},message:"must have required property '"+"target"+"'"};
if(vErrors === null){
vErrors = [err154];
}
else {
vErrors.push(err154);
}
errors++;
}
if(data47.edge === undefined){
const err155 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/required",keyword:"required",params:{missingProperty: "edge"},message:"must have required property '"+"edge"+"'"};
if(vErrors === null){
vErrors = [err155];
}
else {
vErrors.push(err155);
}
errors++;
}
if(data47.align === undefined){
const err156 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/required",keyword:"required",params:{missingProperty: "align"},message:"must have required property '"+"align"+"'"};
if(vErrors === null){
vErrors = [err156];
}
else {
vErrors.push(err156);
}
errors++;
}
if(data47.offset === undefined){
const err157 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/required",keyword:"required",params:{missingProperty: "offset"},message:"must have required property '"+"offset"+"'"};
if(vErrors === null){
vErrors = [err157];
}
else {
vErrors.push(err157);
}
errors++;
}
for(const key7 in data47){
if(!((((key7 === "target") || (key7 === "edge")) || (key7 === "align")) || (key7 === "offset"))){
const err158 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key7},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err158];
}
else {
vErrors.push(err158);
}
errors++;
}
}
if(data47.target !== undefined){
let data48 = data47.target;
if(!(((data48 === "composer") || (data48 === "main-surface")) || (data48 === "thread-summary"))){
const err159 = {instancePath:instancePath+"/attachment/target",schemaPath:"#/properties/attachment/properties/target/enum",keyword:"enum",params:{allowedValues: schema63.properties.attachment.properties.target.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err159];
}
else {
vErrors.push(err159);
}
errors++;
}
}
if(data47.edge !== undefined){
let data49 = data47.edge;
if(!((data49 === "top") || (data49 === "bottom"))){
const err160 = {instancePath:instancePath+"/attachment/edge",schemaPath:"#/properties/attachment/properties/edge/enum",keyword:"enum",params:{allowedValues: schema63.properties.attachment.properties.edge.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err160];
}
else {
vErrors.push(err160);
}
errors++;
}
}
if(data47.align !== undefined){
let data50 = data47.align;
if((typeof data50 == "number") && (isFinite(data50))){
if(data50 > 1 || isNaN(data50)){
const err161 = {instancePath:instancePath+"/attachment/align",schemaPath:"#/properties/attachment/properties/align/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err161];
}
else {
vErrors.push(err161);
}
errors++;
}
if(data50 < 0 || isNaN(data50)){
const err162 = {instancePath:instancePath+"/attachment/align",schemaPath:"#/properties/attachment/properties/align/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err162];
}
else {
vErrors.push(err162);
}
errors++;
}
}
else {
const err163 = {instancePath:instancePath+"/attachment/align",schemaPath:"#/properties/attachment/properties/align/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err163];
}
else {
vErrors.push(err163);
}
errors++;
}
}
if(data47.offset !== undefined){
let data51 = data47.offset;
if(data51 && typeof data51 == "object" && !Array.isArray(data51)){
if(data51.x === undefined){
const err164 = {instancePath:instancePath+"/attachment/offset",schemaPath:"#/properties/attachment/properties/offset/required",keyword:"required",params:{missingProperty: "x"},message:"must have required property '"+"x"+"'"};
if(vErrors === null){
vErrors = [err164];
}
else {
vErrors.push(err164);
}
errors++;
}
if(data51.y === undefined){
const err165 = {instancePath:instancePath+"/attachment/offset",schemaPath:"#/properties/attachment/properties/offset/required",keyword:"required",params:{missingProperty: "y"},message:"must have required property '"+"y"+"'"};
if(vErrors === null){
vErrors = [err165];
}
else {
vErrors.push(err165);
}
errors++;
}
for(const key8 in data51){
if(!((key8 === "x") || (key8 === "y"))){
const err166 = {instancePath:instancePath+"/attachment/offset",schemaPath:"#/properties/attachment/properties/offset/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err166];
}
else {
vErrors.push(err166);
}
errors++;
}
}
if(data51.x !== undefined){
let data52 = data51.x;
if((typeof data52 == "number") && (isFinite(data52))){
if(data52 > 512 || isNaN(data52)){
const err167 = {instancePath:instancePath+"/attachment/offset/x",schemaPath:"#/properties/attachment/properties/offset/properties/x/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err167];
}
else {
vErrors.push(err167);
}
errors++;
}
if(data52 < -512 || isNaN(data52)){
const err168 = {instancePath:instancePath+"/attachment/offset/x",schemaPath:"#/properties/attachment/properties/offset/properties/x/minimum",keyword:"minimum",params:{comparison: ">=", limit: -512},message:"must be >= -512"};
if(vErrors === null){
vErrors = [err168];
}
else {
vErrors.push(err168);
}
errors++;
}
}
else {
const err169 = {instancePath:instancePath+"/attachment/offset/x",schemaPath:"#/properties/attachment/properties/offset/properties/x/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err169];
}
else {
vErrors.push(err169);
}
errors++;
}
}
if(data51.y !== undefined){
let data53 = data51.y;
if((typeof data53 == "number") && (isFinite(data53))){
if(data53 > 512 || isNaN(data53)){
const err170 = {instancePath:instancePath+"/attachment/offset/y",schemaPath:"#/properties/attachment/properties/offset/properties/y/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err170];
}
else {
vErrors.push(err170);
}
errors++;
}
if(data53 < -512 || isNaN(data53)){
const err171 = {instancePath:instancePath+"/attachment/offset/y",schemaPath:"#/properties/attachment/properties/offset/properties/y/minimum",keyword:"minimum",params:{comparison: ">=", limit: -512},message:"must be >= -512"};
if(vErrors === null){
vErrors = [err171];
}
else {
vErrors.push(err171);
}
errors++;
}
}
else {
const err172 = {instancePath:instancePath+"/attachment/offset/y",schemaPath:"#/properties/attachment/properties/offset/properties/y/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err172];
}
else {
vErrors.push(err172);
}
errors++;
}
}
}
else {
const err173 = {instancePath:instancePath+"/attachment/offset",schemaPath:"#/properties/attachment/properties/offset/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err173];
}
else {
vErrors.push(err173);
}
errors++;
}
}
}
else {
const err174 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err174];
}
else {
vErrors.push(err174);
}
errors++;
}
}
if(data.size !== undefined){
let data54 = data.size;
if((typeof data54 == "number") && (isFinite(data54))){
if(data54 > 512 || isNaN(data54)){
const err175 = {instancePath:instancePath+"/size",schemaPath:"#/properties/size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err175];
}
else {
vErrors.push(err175);
}
errors++;
}
if(data54 < 24 || isNaN(data54)){
const err176 = {instancePath:instancePath+"/size",schemaPath:"#/properties/size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 24},message:"must be >= 24"};
if(vErrors === null){
vErrors = [err176];
}
else {
vErrors.push(err176);
}
errors++;
}
}
else {
const err177 = {instancePath:instancePath+"/size",schemaPath:"#/properties/size/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err177];
}
else {
vErrors.push(err177);
}
errors++;
}
}
if(data.opacity !== undefined){
let data55 = data.opacity;
if((typeof data55 == "number") && (isFinite(data55))){
if(data55 > 1 || isNaN(data55)){
const err178 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err178];
}
else {
vErrors.push(err178);
}
errors++;
}
if(data55 < 0 || isNaN(data55)){
const err179 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err179];
}
else {
vErrors.push(err179);
}
errors++;
}
}
else {
const err180 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err180];
}
else {
vErrors.push(err180);
}
errors++;
}
}
}
else {
const err181 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err181];
}
else {
vErrors.push(err181);
}
errors++;
}
validate26.errors = vErrors;
return errors === 0;
}
validate26.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema69 = {"type":"object","additionalProperties":false,"required":["id","path","type","license"],"properties":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"path":{"$ref":"#/$defs/assetPath"},"type":{"enum":["background","image","sprite-atlas","preview"]},"license":{"type":"string","minLength":1,"maxLength":64}}};

function validate28(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate28.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.id === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.path === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "path"},message:"must have required property '"+"path"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.type === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.license === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "license"},message:"must have required property '"+"license"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "id") || (key0 === "path")) || (key0 === "type")) || (key0 === "license"))){
const err4 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(!pattern36.test(data0)){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
else {
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.path !== undefined){
let data1 = data.path;
if(typeof data1 === "string"){
if(func2(data1) > 180){
const err7 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!pattern6.test(data1)){
const err8 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
else {
const err9 = {instancePath:instancePath+"/path",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.type !== undefined){
let data2 = data.type;
if(!((((data2 === "background") || (data2 === "image")) || (data2 === "sprite-atlas")) || (data2 === "preview"))){
const err10 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/enum",keyword:"enum",params:{allowedValues: schema69.properties.type.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.license !== undefined){
let data3 = data.license;
if(typeof data3 === "string"){
if(func2(data3) > 64){
const err11 = {instancePath:instancePath+"/license",schemaPath:"#/properties/license/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func2(data3) < 1){
const err12 = {instancePath:instancePath+"/license",schemaPath:"#/properties/license/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
else {
const err13 = {instancePath:instancePath+"/license",schemaPath:"#/properties/license/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
}
else {
const err14 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
validate28.errors = vErrors;
return errors === 0;
}
validate28.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://xuhuanstudio.github.io/codex-styler/schema/theme-v1.json" */;
let vErrors = null;
let errors = 0;
const evaluated0 = validate20.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.format === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "format"},message:"must have required property '"+"format"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.id === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "id"},message:"must have required property '"+"id"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.version === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "version"},message:"must have required property '"+"version"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.metadata === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "metadata"},message:"must have required property '"+"metadata"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.compatibility === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "compatibility"},message:"must have required property '"+"compatibility"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.variants === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "variants"},message:"must have required property '"+"variants"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.scene === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "scene"},message:"must have required property '"+"scene"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.assets === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "assets"},message:"must have required property '"+"assets"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(data.locales === undefined){
const err8 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "locales"},message:"must have required property '"+"locales"+"'"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
for(const key0 in data){
if(!(func1.call(schema31.properties, key0))){
const err9 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.format !== undefined){
if("codex-styler-theme-v1" !== data.format){
const err10 = {instancePath:instancePath+"/format",schemaPath:"#/properties/format/const",keyword:"const",params:{allowedValue: "codex-styler-theme-v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 === "string"){
if(!pattern4.test(data1)){
const err11 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9.-]{2,63}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9.-]{2,63}$"+"\""};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/id",schemaPath:"#/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data.version !== undefined){
let data2 = data.version;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err13 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/pattern",keyword:"pattern",params:{pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$"},message:"must match pattern \""+"^[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$"+"\""};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
else {
const err14 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data.metadata !== undefined){
let data3 = data.metadata;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.name === undefined){
const err15 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data3.description === undefined){
const err16 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data3.author === undefined){
const err17 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "author"},message:"must have required property '"+"author"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data3.license === undefined){
const err18 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "license"},message:"must have required property '"+"license"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data3.tags === undefined){
const err19 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "tags"},message:"must have required property '"+"tags"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
for(const key1 in data3){
if(!((((((((key1 === "name") || (key1 === "description")) || (key1 === "author")) || (key1 === "license")) || (key1 === "tags")) || (key1 === "homepage")) || (key1 === "preview")) || (key1 === "recommendedCompanionId"))){
const err20 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
}
if(data3.name !== undefined){
let data4 = data3.name;
if(typeof data4 === "string"){
if(func2(data4) > 64){
const err21 = {instancePath:instancePath+"/metadata/name",schemaPath:"#/properties/metadata/properties/name/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(func2(data4) < 1){
const err22 = {instancePath:instancePath+"/metadata/name",schemaPath:"#/properties/metadata/properties/name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
else {
const err23 = {instancePath:instancePath+"/metadata/name",schemaPath:"#/properties/metadata/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data3.description !== undefined){
let data5 = data3.description;
if(typeof data5 === "string"){
if(func2(data5) > 240){
const err24 = {instancePath:instancePath+"/metadata/description",schemaPath:"#/properties/metadata/properties/description/maxLength",keyword:"maxLength",params:{limit: 240},message:"must NOT have more than 240 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
if(func2(data5) < 1){
const err25 = {instancePath:instancePath+"/metadata/description",schemaPath:"#/properties/metadata/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
else {
const err26 = {instancePath:instancePath+"/metadata/description",schemaPath:"#/properties/metadata/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data3.author !== undefined){
let data6 = data3.author;
if(typeof data6 === "string"){
if(func2(data6) > 80){
const err27 = {instancePath:instancePath+"/metadata/author",schemaPath:"#/properties/metadata/properties/author/maxLength",keyword:"maxLength",params:{limit: 80},message:"must NOT have more than 80 characters"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(func2(data6) < 1){
const err28 = {instancePath:instancePath+"/metadata/author",schemaPath:"#/properties/metadata/properties/author/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
else {
const err29 = {instancePath:instancePath+"/metadata/author",schemaPath:"#/properties/metadata/properties/author/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data3.license !== undefined){
let data7 = data3.license;
if(typeof data7 === "string"){
if(func2(data7) > 64){
const err30 = {instancePath:instancePath+"/metadata/license",schemaPath:"#/properties/metadata/properties/license/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(func2(data7) < 1){
const err31 = {instancePath:instancePath+"/metadata/license",schemaPath:"#/properties/metadata/properties/license/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
else {
const err32 = {instancePath:instancePath+"/metadata/license",schemaPath:"#/properties/metadata/properties/license/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data3.tags !== undefined){
let data8 = data3.tags;
if(Array.isArray(data8)){
if(data8.length > 12){
const err33 = {instancePath:instancePath+"/metadata/tags",schemaPath:"#/properties/metadata/properties/tags/maxItems",keyword:"maxItems",params:{limit: 12},message:"must NOT have more than 12 items"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
const len0 = data8.length;
for(let i0=0; i0<len0; i0++){
let data9 = data8[i0];
if(typeof data9 === "string"){
if(func2(data9) > 32){
const err34 = {instancePath:instancePath+"/metadata/tags/" + i0,schemaPath:"#/properties/metadata/properties/tags/items/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(func2(data9) < 1){
const err35 = {instancePath:instancePath+"/metadata/tags/" + i0,schemaPath:"#/properties/metadata/properties/tags/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
else {
const err36 = {instancePath:instancePath+"/metadata/tags/" + i0,schemaPath:"#/properties/metadata/properties/tags/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
let i1 = data8.length;
let j0;
if(i1 > 1){
const indices0 = {};
for(;i1--;){
let item0 = data8[i1];
if(typeof item0 !== "string"){
continue;
}
if(typeof indices0[item0] == "number"){
j0 = indices0[item0];
const err37 = {instancePath:instancePath+"/metadata/tags",schemaPath:"#/properties/metadata/properties/tags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err38 = {instancePath:instancePath+"/metadata/tags",schemaPath:"#/properties/metadata/properties/tags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data3.homepage !== undefined){
let data10 = data3.homepage;
if(typeof data10 === "string"){
if(func2(data10) > 240){
const err39 = {instancePath:instancePath+"/metadata/homepage",schemaPath:"#/properties/metadata/properties/homepage/maxLength",keyword:"maxLength",params:{limit: 240},message:"must NOT have more than 240 characters"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(!(formats0(data10))){
const err40 = {instancePath:instancePath+"/metadata/homepage",schemaPath:"#/properties/metadata/properties/homepage/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
else {
const err41 = {instancePath:instancePath+"/metadata/homepage",schemaPath:"#/properties/metadata/properties/homepage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data3.preview !== undefined){
let data11 = data3.preview;
if(typeof data11 === "string"){
if(func2(data11) > 180){
const err42 = {instancePath:instancePath+"/metadata/preview",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(!pattern6.test(data11)){
const err43 = {instancePath:instancePath+"/metadata/preview",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
else {
const err44 = {instancePath:instancePath+"/metadata/preview",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data3.recommendedCompanionId !== undefined){
let data12 = data3.recommendedCompanionId;
if(typeof data12 === "string"){
if(!pattern4.test(data12)){
const err45 = {instancePath:instancePath+"/metadata/recommendedCompanionId",schemaPath:"#/properties/metadata/properties/recommendedCompanionId/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9.-]{2,63}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9.-]{2,63}$"+"\""};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
else {
const err46 = {instancePath:instancePath+"/metadata/recommendedCompanionId",schemaPath:"#/properties/metadata/properties/recommendedCompanionId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
else {
const err47 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data.compatibility !== undefined){
let data13 = data.compatibility;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.styler === undefined){
const err48 = {instancePath:instancePath+"/compatibility",schemaPath:"#/properties/compatibility/required",keyword:"required",params:{missingProperty: "styler"},message:"must have required property '"+"styler"+"'"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data13.codex === undefined){
const err49 = {instancePath:instancePath+"/compatibility",schemaPath:"#/properties/compatibility/required",keyword:"required",params:{missingProperty: "codex"},message:"must have required property '"+"codex"+"'"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
for(const key2 in data13){
if(!((key2 === "styler") || (key2 === "codex"))){
const err50 = {instancePath:instancePath+"/compatibility",schemaPath:"#/properties/compatibility/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
if(data13.styler !== undefined){
let data14 = data13.styler;
if(data14 && typeof data14 == "object" && !Array.isArray(data14)){
if(data14.minimumVersion === undefined){
const err51 = {instancePath:instancePath+"/compatibility/styler",schemaPath:"#/properties/compatibility/properties/styler/required",keyword:"required",params:{missingProperty: "minimumVersion"},message:"must have required property '"+"minimumVersion"+"'"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
for(const key3 in data14){
if(!(key3 === "minimumVersion")){
const err52 = {instancePath:instancePath+"/compatibility/styler",schemaPath:"#/properties/compatibility/properties/styler/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data14.minimumVersion !== undefined){
let data15 = data14.minimumVersion;
if(typeof data15 === "string"){
if(!pattern8.test(data15)){
const err53 = {instancePath:instancePath+"/compatibility/styler/minimumVersion",schemaPath:"#/properties/compatibility/properties/styler/properties/minimumVersion/pattern",keyword:"pattern",params:{pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+"},message:"must match pattern \""+"^[0-9]+\\.[0-9]+\\.[0-9]+"+"\""};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
else {
const err54 = {instancePath:instancePath+"/compatibility/styler/minimumVersion",schemaPath:"#/properties/compatibility/properties/styler/properties/minimumVersion/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
else {
const err55 = {instancePath:instancePath+"/compatibility/styler",schemaPath:"#/properties/compatibility/properties/styler/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data13.codex !== undefined){
let data16 = data13.codex;
if(data16 && typeof data16 == "object" && !Array.isArray(data16)){
if(data16.mode === undefined){
const err56 = {instancePath:instancePath+"/compatibility/codex",schemaPath:"#/properties/compatibility/properties/codex/required",keyword:"required",params:{missingProperty: "mode"},message:"must have required property '"+"mode"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data16.testedVersions === undefined){
const err57 = {instancePath:instancePath+"/compatibility/codex",schemaPath:"#/properties/compatibility/properties/codex/required",keyword:"required",params:{missingProperty: "testedVersions"},message:"must have required property '"+"testedVersions"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
for(const key4 in data16){
if(!((key4 === "mode") || (key4 === "testedVersions"))){
const err58 = {instancePath:instancePath+"/compatibility/codex",schemaPath:"#/properties/compatibility/properties/codex/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key4},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data16.mode !== undefined){
let data17 = data16.mode;
if(!((data17 === "safe") || (data17 === "semantic"))){
const err59 = {instancePath:instancePath+"/compatibility/codex/mode",schemaPath:"#/properties/compatibility/properties/codex/properties/mode/enum",keyword:"enum",params:{allowedValues: schema31.properties.compatibility.properties.codex.properties.mode.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data16.testedVersions !== undefined){
let data18 = data16.testedVersions;
if(Array.isArray(data18)){
if(data18.length > 32){
const err60 = {instancePath:instancePath+"/compatibility/codex/testedVersions",schemaPath:"#/properties/compatibility/properties/codex/properties/testedVersions/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
const len1 = data18.length;
for(let i2=0; i2<len1; i2++){
let data19 = data18[i2];
if(typeof data19 === "string"){
if(func2(data19) > 40){
const err61 = {instancePath:instancePath+"/compatibility/codex/testedVersions/" + i2,schemaPath:"#/properties/compatibility/properties/codex/properties/testedVersions/items/maxLength",keyword:"maxLength",params:{limit: 40},message:"must NOT have more than 40 characters"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if(func2(data19) < 1){
const err62 = {instancePath:instancePath+"/compatibility/codex/testedVersions/" + i2,schemaPath:"#/properties/compatibility/properties/codex/properties/testedVersions/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
else {
const err63 = {instancePath:instancePath+"/compatibility/codex/testedVersions/" + i2,schemaPath:"#/properties/compatibility/properties/codex/properties/testedVersions/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
}
else {
const err64 = {instancePath:instancePath+"/compatibility/codex/testedVersions",schemaPath:"#/properties/compatibility/properties/codex/properties/testedVersions/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
}
}
else {
const err65 = {instancePath:instancePath+"/compatibility/codex",schemaPath:"#/properties/compatibility/properties/codex/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
}
else {
const err66 = {instancePath:instancePath+"/compatibility",schemaPath:"#/properties/compatibility/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data.variants !== undefined){
let data20 = data.variants;
if(data20 && typeof data20 == "object" && !Array.isArray(data20)){
if(data20.light === undefined){
const err67 = {instancePath:instancePath+"/variants",schemaPath:"#/properties/variants/required",keyword:"required",params:{missingProperty: "light"},message:"must have required property '"+"light"+"'"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if(data20.dark === undefined){
const err68 = {instancePath:instancePath+"/variants",schemaPath:"#/properties/variants/required",keyword:"required",params:{missingProperty: "dark"},message:"must have required property '"+"dark"+"'"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
for(const key5 in data20){
if(!((key5 === "light") || (key5 === "dark"))){
const err69 = {instancePath:instancePath+"/variants",schemaPath:"#/properties/variants/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
if(data20.light !== undefined){
if(!(validate21(data20.light, {instancePath:instancePath+"/variants/light",parentData:data20,parentDataProperty:"light",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data20.dark !== undefined){
if(!(validate21(data20.dark, {instancePath:instancePath+"/variants/dark",parentData:data20,parentDataProperty:"dark",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
}
else {
const err70 = {instancePath:instancePath+"/variants",schemaPath:"#/properties/variants/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
}
if(data.scene !== undefined){
let data23 = data.scene;
if(data23 && typeof data23 == "object" && !Array.isArray(data23)){
if(data23.layers === undefined){
const err71 = {instancePath:instancePath+"/scene",schemaPath:"#/properties/scene/required",keyword:"required",params:{missingProperty: "layers"},message:"must have required property '"+"layers"+"'"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
if(data23.entities === undefined){
const err72 = {instancePath:instancePath+"/scene",schemaPath:"#/properties/scene/required",keyword:"required",params:{missingProperty: "entities"},message:"must have required property '"+"entities"+"'"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
for(const key6 in data23){
if(!((key6 === "layers") || (key6 === "entities"))){
const err73 = {instancePath:instancePath+"/scene",schemaPath:"#/properties/scene/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key6},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data23.layers !== undefined){
let data24 = data23.layers;
if(Array.isArray(data24)){
if(data24.length > 8){
const err74 = {instancePath:instancePath+"/scene/layers",schemaPath:"#/properties/scene/properties/layers/maxItems",keyword:"maxItems",params:{limit: 8},message:"must NOT have more than 8 items"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
const len2 = data24.length;
for(let i3=0; i3<len2; i3++){
if(!(validate24(data24[i3], {instancePath:instancePath+"/scene/layers/" + i3,parentData:data24,parentDataProperty:i3,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
errors = vErrors.length;
}
}
}
else {
const err75 = {instancePath:instancePath+"/scene/layers",schemaPath:"#/properties/scene/properties/layers/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
}
if(data23.entities !== undefined){
let data26 = data23.entities;
if(Array.isArray(data26)){
if(data26.length > 1){
const err76 = {instancePath:instancePath+"/scene/entities",schemaPath:"#/properties/scene/properties/entities/maxItems",keyword:"maxItems",params:{limit: 1},message:"must NOT have more than 1 items"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
const len3 = data26.length;
for(let i4=0; i4<len3; i4++){
if(!(validate26(data26[i4], {instancePath:instancePath+"/scene/entities/" + i4,parentData:data26,parentDataProperty:i4,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
errors = vErrors.length;
}
}
}
else {
const err77 = {instancePath:instancePath+"/scene/entities",schemaPath:"#/properties/scene/properties/entities/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
}
}
else {
const err78 = {instancePath:instancePath+"/scene",schemaPath:"#/properties/scene/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
}
if(data.assets !== undefined){
let data28 = data.assets;
if(Array.isArray(data28)){
if(data28.length > 32){
const err79 = {instancePath:instancePath+"/assets",schemaPath:"#/properties/assets/maxItems",keyword:"maxItems",params:{limit: 32},message:"must NOT have more than 32 items"};
if(vErrors === null){
vErrors = [err79];
}
else {
vErrors.push(err79);
}
errors++;
}
const len4 = data28.length;
for(let i5=0; i5<len4; i5++){
if(!(validate28(data28[i5], {instancePath:instancePath+"/assets/" + i5,parentData:data28,parentDataProperty:i5,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
errors = vErrors.length;
}
}
}
else {
const err80 = {instancePath:instancePath+"/assets",schemaPath:"#/properties/assets/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err80];
}
else {
vErrors.push(err80);
}
errors++;
}
}
if(data.locales !== undefined){
let data30 = data.locales;
if(data30 && typeof data30 == "object" && !Array.isArray(data30)){
for(const key7 in data30){
let data31 = data30[key7];
if(data31 && typeof data31 == "object" && !Array.isArray(data31)){
if(data31.name === undefined){
const err81 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/locales/additionalProperties/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err81];
}
else {
vErrors.push(err81);
}
errors++;
}
if(data31.description === undefined){
const err82 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/locales/additionalProperties/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err82];
}
else {
vErrors.push(err82);
}
errors++;
}
for(const key8 in data31){
if(!((key8 === "name") || (key8 === "description"))){
const err83 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/locales/additionalProperties/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key8},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err83];
}
else {
vErrors.push(err83);
}
errors++;
}
}
if(data31.name !== undefined){
let data32 = data31.name;
if(typeof data32 === "string"){
if(func2(data32) > 64){
const err84 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1")+"/name",schemaPath:"#/properties/locales/additionalProperties/properties/name/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err84];
}
else {
vErrors.push(err84);
}
errors++;
}
if(func2(data32) < 1){
const err85 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1")+"/name",schemaPath:"#/properties/locales/additionalProperties/properties/name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err85];
}
else {
vErrors.push(err85);
}
errors++;
}
}
else {
const err86 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1")+"/name",schemaPath:"#/properties/locales/additionalProperties/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err86];
}
else {
vErrors.push(err86);
}
errors++;
}
}
if(data31.description !== undefined){
let data33 = data31.description;
if(typeof data33 === "string"){
if(func2(data33) > 240){
const err87 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1")+"/description",schemaPath:"#/properties/locales/additionalProperties/properties/description/maxLength",keyword:"maxLength",params:{limit: 240},message:"must NOT have more than 240 characters"};
if(vErrors === null){
vErrors = [err87];
}
else {
vErrors.push(err87);
}
errors++;
}
if(func2(data33) < 1){
const err88 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1")+"/description",schemaPath:"#/properties/locales/additionalProperties/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err88];
}
else {
vErrors.push(err88);
}
errors++;
}
}
else {
const err89 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1")+"/description",schemaPath:"#/properties/locales/additionalProperties/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err89];
}
else {
vErrors.push(err89);
}
errors++;
}
}
}
else {
const err90 = {instancePath:instancePath+"/locales/" + key7.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/locales/additionalProperties/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err90];
}
else {
vErrors.push(err90);
}
errors++;
}
}
}
else {
const err91 = {instancePath:instancePath+"/locales",schemaPath:"#/properties/locales/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err91];
}
else {
vErrors.push(err91);
}
errors++;
}
}
}
else {
const err92 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err92];
}
else {
vErrors.push(err92);
}
errors++;
}
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
