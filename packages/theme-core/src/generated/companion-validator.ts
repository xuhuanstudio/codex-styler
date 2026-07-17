// Generated from schema/companion.schema.json. Do not edit by hand.
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
const schema31 = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://xuhuanstudio.github.io/codex-styler/schema/companion-v1.json","title":"Codex Styler Companion v1","type":"object","additionalProperties":false,"required":["format","id","version","metadata","compatibility","entity","assets","locales"],"properties":{"format":{"const":"codex-styler-companion-v1"},"id":{"$ref":"#/$defs/packageId"},"version":{"type":"string","pattern":"^[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$"},"metadata":{"type":"object","additionalProperties":false,"required":["name","description","author","license","tags"],"properties":{"name":{"type":"string","minLength":1,"maxLength":64},"description":{"type":"string","minLength":1,"maxLength":240},"author":{"type":"string","minLength":1,"maxLength":80},"license":{"type":"string","minLength":1,"maxLength":64},"tags":{"type":"array","maxItems":12,"uniqueItems":true,"items":{"type":"string","minLength":1,"maxLength":32}},"homepage":{"type":"string","format":"uri","maxLength":240},"preview":{"$ref":"#/$defs/assetPath"}}},"compatibility":{"type":"object","additionalProperties":false,"required":["styler"],"properties":{"styler":{"type":"object","additionalProperties":false,"required":["minimumVersion"],"properties":{"minimumVersion":{"type":"string","pattern":"^[0-9]+\\.[0-9]+\\.[0-9]+"}}}}},"entity":{"$ref":"#/$defs/entity"},"assets":{"type":"array","minItems":1,"maxItems":16,"items":{"$ref":"#/$defs/asset"}},"locales":{"type":"object","additionalProperties":{"type":"object","additionalProperties":false,"required":["name","description"],"properties":{"name":{"type":"string","minLength":1,"maxLength":64},"description":{"type":"string","minLength":1,"maxLength":240}}}}},"$defs":{"packageId":{"type":"string","pattern":"^[a-z0-9][a-z0-9.-]{2,63}$"},"localId":{"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"},"assetPath":{"type":"string","pattern":"^(assets|previews)/[A-Za-z0-9._/-]+$","maxLength":180},"pose":{"type":"object","additionalProperties":false,"required":["id","angle","frame"],"properties":{"id":{"$ref":"#/$defs/localId"},"angle":{"type":"number","minimum":0,"exclusiveMaximum":360},"frame":{"type":"integer","minimum":0,"maximum":511}}},"idleFrame":{"type":"object","additionalProperties":false,"required":["frame","durationMs"],"properties":{"frame":{"type":"integer","minimum":0,"maximum":511},"durationMs":{"type":"integer","minimum":16,"maximum":5000}}},"idleClip":{"type":"object","additionalProperties":false,"required":["id","poseIds","frames","minimumDelayMs","maximumDelayMs"],"properties":{"id":{"$ref":"#/$defs/localId"},"poseIds":{"type":"array","minItems":1,"maxItems":512,"uniqueItems":true,"items":{"$ref":"#/$defs/localId"}},"frames":{"type":"array","minItems":1,"maxItems":120,"items":{"$ref":"#/$defs/idleFrame"}},"minimumDelayMs":{"type":"integer","minimum":250,"maximum":120000},"maximumDelayMs":{"type":"integer","minimum":250,"maximum":120000}}},"renderer":{"oneOf":[{"type":"object","additionalProperties":false,"required":["type","asset"],"properties":{"type":{"const":"image"},"asset":{"$ref":"#/$defs/assetPath"},"normalization":{"enum":["preserve","grounded"]},"alphaThreshold":{"type":"integer","minimum":0,"maximum":255}}},{"type":"object","additionalProperties":false,"required":["type","asset","pages","columns","rows","framesPerPage","frameWidth","frameHeight","directions","frameCount","poses"],"properties":{"type":{"const":"sprite-atlas"},"asset":{"$ref":"#/$defs/assetPath"},"pages":{"type":"array","minItems":1,"maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/assetPath"}},"columns":{"type":"integer","minimum":1,"maximum":16},"rows":{"type":"integer","minimum":1,"maximum":16},"framesPerPage":{"type":"integer","minimum":1,"maximum":256},"frameWidth":{"type":"integer","minimum":16,"maximum":1024},"frameHeight":{"type":"integer","minimum":16,"maximum":1024},"directions":{"type":"integer","minimum":4,"maximum":512},"frameCount":{"type":"integer","minimum":4,"maximum":512},"poses":{"type":"array","minItems":4,"maxItems":512,"items":{"$ref":"#/$defs/pose"}},"idleClips":{"type":"array","maxItems":64,"items":{"$ref":"#/$defs/idleClip"}},"neutralFrame":{"type":"integer","minimum":0,"maximum":511},"reducedMotionFrame":{"type":"integer","minimum":0,"maximum":511},"transitionFps":{"type":"integer","minimum":12,"maximum":60},"followSmoothing":{"type":"number","minimum":0.02,"maximum":1},"normalization":{"enum":["preserve","grounded"]},"alphaThreshold":{"type":"integer","minimum":0,"maximum":255}}}]},"entity":{"type":"object","additionalProperties":false,"required":["id","name","renderer","behaviors","anchor","size","opacity"],"properties":{"id":{"$ref":"#/$defs/localId"},"name":{"type":"string","minLength":1,"maxLength":64},"renderer":{"$ref":"#/$defs/renderer"},"behaviors":{"type":"array","uniqueItems":true,"items":{"enum":["idle","parallax","look-at-pointer","reduce-motion-fallback"]}},"anchor":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":0,"maximum":100},"y":{"type":"number","minimum":0,"maximum":100}}},"attachment":{"type":"object","additionalProperties":false,"required":["target","edge","align","offset"],"properties":{"target":{"enum":["composer","main-surface","thread-summary"]},"edge":{"enum":["top","bottom"]},"align":{"type":"number","minimum":0,"maximum":1},"offset":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":-512,"maximum":512},"y":{"type":"number","minimum":-512,"maximum":512}}}}},"size":{"type":"number","minimum":24,"maximum":512},"opacity":{"type":"number","minimum":0,"maximum":1}}},"asset":{"type":"object","additionalProperties":false,"required":["id","path","type","license"],"properties":{"id":{"$ref":"#/$defs/localId"},"path":{"$ref":"#/$defs/assetPath"},"type":{"enum":["image","sprite-atlas","preview"]},"license":{"type":"string","minLength":1,"maxLength":64}}}}};
const schema32 = {"type":"string","pattern":"^[a-z0-9][a-z0-9.-]{2,63}$"};
const schema33 = {"type":"string","pattern":"^(assets|previews)/[A-Za-z0-9._/-]+$","maxLength":180};
const pattern4 = new RegExp("^[a-z0-9][a-z0-9.-]{2,63}$", "u");
const pattern5 = new RegExp("^[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$", "u");
const pattern6 = new RegExp("^(assets|previews)/[A-Za-z0-9._/-]+$", "u");
const pattern7 = new RegExp("^[0-9]+\\.[0-9]+\\.[0-9]+", "u");
const func1 = ucs2Length;
const formats0 = fullFormats.uri;
const schema34 = {"type":"object","additionalProperties":false,"required":["id","name","renderer","behaviors","anchor","size","opacity"],"properties":{"id":{"$ref":"#/$defs/localId"},"name":{"type":"string","minLength":1,"maxLength":64},"renderer":{"$ref":"#/$defs/renderer"},"behaviors":{"type":"array","uniqueItems":true,"items":{"enum":["idle","parallax","look-at-pointer","reduce-motion-fallback"]}},"anchor":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":0,"maximum":100},"y":{"type":"number","minimum":0,"maximum":100}}},"attachment":{"type":"object","additionalProperties":false,"required":["target","edge","align","offset"],"properties":{"target":{"enum":["composer","main-surface","thread-summary"]},"edge":{"enum":["top","bottom"]},"align":{"type":"number","minimum":0,"maximum":1},"offset":{"type":"object","additionalProperties":false,"required":["x","y"],"properties":{"x":{"type":"number","minimum":-512,"maximum":512},"y":{"type":"number","minimum":-512,"maximum":512}}}}},"size":{"type":"number","minimum":24,"maximum":512},"opacity":{"type":"number","minimum":0,"maximum":1}}};
const schema35 = {"type":"string","pattern":"^[a-z0-9][a-z0-9-]{1,39}$"};
const pattern8 = new RegExp("^[a-z0-9][a-z0-9-]{1,39}$", "u");
const func0 = deepEqual;
const schema36 = {"oneOf":[{"type":"object","additionalProperties":false,"required":["type","asset"],"properties":{"type":{"const":"image"},"asset":{"$ref":"#/$defs/assetPath"},"normalization":{"enum":["preserve","grounded"]},"alphaThreshold":{"type":"integer","minimum":0,"maximum":255}}},{"type":"object","additionalProperties":false,"required":["type","asset","pages","columns","rows","framesPerPage","frameWidth","frameHeight","directions","frameCount","poses"],"properties":{"type":{"const":"sprite-atlas"},"asset":{"$ref":"#/$defs/assetPath"},"pages":{"type":"array","minItems":1,"maxItems":8,"uniqueItems":true,"items":{"$ref":"#/$defs/assetPath"}},"columns":{"type":"integer","minimum":1,"maximum":16},"rows":{"type":"integer","minimum":1,"maximum":16},"framesPerPage":{"type":"integer","minimum":1,"maximum":256},"frameWidth":{"type":"integer","minimum":16,"maximum":1024},"frameHeight":{"type":"integer","minimum":16,"maximum":1024},"directions":{"type":"integer","minimum":4,"maximum":512},"frameCount":{"type":"integer","minimum":4,"maximum":512},"poses":{"type":"array","minItems":4,"maxItems":512,"items":{"$ref":"#/$defs/pose"}},"idleClips":{"type":"array","maxItems":64,"items":{"$ref":"#/$defs/idleClip"}},"neutralFrame":{"type":"integer","minimum":0,"maximum":511},"reducedMotionFrame":{"type":"integer","minimum":0,"maximum":511},"transitionFps":{"type":"integer","minimum":12,"maximum":60},"followSmoothing":{"type":"number","minimum":0.02,"maximum":1},"normalization":{"enum":["preserve","grounded"]},"alphaThreshold":{"type":"integer","minimum":0,"maximum":255}}}]};
const func16 = Object.prototype.hasOwnProperty;
const schema40 = {"type":"object","additionalProperties":false,"required":["id","angle","frame"],"properties":{"id":{"$ref":"#/$defs/localId"},"angle":{"type":"number","minimum":0,"exclusiveMaximum":360},"frame":{"type":"integer","minimum":0,"maximum":511}}};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate23.evaluated;
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
if(data.angle === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "angle"},message:"must have required property '"+"angle"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.frame === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "frame"},message:"must have required property '"+"frame"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!(((key0 === "id") || (key0 === "angle")) || (key0 === "frame"))){
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
if(data.id !== undefined){
let data0 = data.id;
if(typeof data0 === "string"){
if(!pattern8.test(data0)){
const err4 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/localId/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
}
else {
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/localId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.angle !== undefined){
let data1 = data.angle;
if((typeof data1 == "number") && (isFinite(data1))){
if(data1 < 0 || isNaN(data1)){
const err6 = {instancePath:instancePath+"/angle",schemaPath:"#/properties/angle/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data1 >= 360 || isNaN(data1)){
const err7 = {instancePath:instancePath+"/angle",schemaPath:"#/properties/angle/exclusiveMaximum",keyword:"exclusiveMaximum",params:{comparison: "<", limit: 360},message:"must be < 360"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
else {
const err8 = {instancePath:instancePath+"/angle",schemaPath:"#/properties/angle/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.frame !== undefined){
let data2 = data.frame;
if(!(((typeof data2 == "number") && (!(data2 % 1) && !isNaN(data2))) && (isFinite(data2)))){
const err9 = {instancePath:instancePath+"/frame",schemaPath:"#/properties/frame/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if((typeof data2 == "number") && (isFinite(data2))){
if(data2 > 511 || isNaN(data2)){
const err10 = {instancePath:instancePath+"/frame",schemaPath:"#/properties/frame/maximum",keyword:"maximum",params:{comparison: "<=", limit: 511},message:"must be <= 511"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data2 < 0 || isNaN(data2)){
const err11 = {instancePath:instancePath+"/frame",schemaPath:"#/properties/frame/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
}
}
else {
const err12 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
validate23.errors = vErrors;
return errors === 0;
}
validate23.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema42 = {"type":"object","additionalProperties":false,"required":["id","poseIds","frames","minimumDelayMs","maximumDelayMs"],"properties":{"id":{"$ref":"#/$defs/localId"},"poseIds":{"type":"array","minItems":1,"maxItems":512,"uniqueItems":true,"items":{"$ref":"#/$defs/localId"}},"frames":{"type":"array","minItems":1,"maxItems":120,"items":{"$ref":"#/$defs/idleFrame"}},"minimumDelayMs":{"type":"integer","minimum":250,"maximum":120000},"maximumDelayMs":{"type":"integer","minimum":250,"maximum":120000}}};
const schema45 = {"type":"object","additionalProperties":false,"required":["frame","durationMs"],"properties":{"frame":{"type":"integer","minimum":0,"maximum":511},"durationMs":{"type":"integer","minimum":16,"maximum":5000}}};

function validate25(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate25.evaluated;
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
if(data.poseIds === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "poseIds"},message:"must have required property '"+"poseIds"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.frames === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "frames"},message:"must have required property '"+"frames"+"'"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.minimumDelayMs === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "minimumDelayMs"},message:"must have required property '"+"minimumDelayMs"+"'"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.maximumDelayMs === undefined){
const err4 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "maximumDelayMs"},message:"must have required property '"+"maximumDelayMs"+"'"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
for(const key0 in data){
if(!(((((key0 === "id") || (key0 === "poseIds")) || (key0 === "frames")) || (key0 === "minimumDelayMs")) || (key0 === "maximumDelayMs"))){
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
if(!pattern8.test(data0)){
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/localId/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
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
const err7 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/localId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.poseIds !== undefined){
let data1 = data.poseIds;
if(Array.isArray(data1)){
if(data1.length > 512){
const err8 = {instancePath:instancePath+"/poseIds",schemaPath:"#/properties/poseIds/maxItems",keyword:"maxItems",params:{limit: 512},message:"must NOT have more than 512 items"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data1.length < 1){
const err9 = {instancePath:instancePath+"/poseIds",schemaPath:"#/properties/poseIds/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const len0 = data1.length;
for(let i0=0; i0<len0; i0++){
let data2 = data1[i0];
if(typeof data2 === "string"){
if(!pattern8.test(data2)){
const err10 = {instancePath:instancePath+"/poseIds/" + i0,schemaPath:"#/$defs/localId/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
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
const err11 = {instancePath:instancePath+"/poseIds/" + i0,schemaPath:"#/$defs/localId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
let i1 = data1.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data1[i1], data1[j0])){
const err12 = {instancePath:instancePath+"/poseIds",schemaPath:"#/properties/poseIds/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err13 = {instancePath:instancePath+"/poseIds",schemaPath:"#/properties/poseIds/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.frames !== undefined){
let data3 = data.frames;
if(Array.isArray(data3)){
if(data3.length > 120){
const err14 = {instancePath:instancePath+"/frames",schemaPath:"#/properties/frames/maxItems",keyword:"maxItems",params:{limit: 120},message:"must NOT have more than 120 items"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data3.length < 1){
const err15 = {instancePath:instancePath+"/frames",schemaPath:"#/properties/frames/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
const len1 = data3.length;
for(let i2=0; i2<len1; i2++){
let data4 = data3[i2];
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.frame === undefined){
const err16 = {instancePath:instancePath+"/frames/" + i2,schemaPath:"#/$defs/idleFrame/required",keyword:"required",params:{missingProperty: "frame"},message:"must have required property '"+"frame"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data4.durationMs === undefined){
const err17 = {instancePath:instancePath+"/frames/" + i2,schemaPath:"#/$defs/idleFrame/required",keyword:"required",params:{missingProperty: "durationMs"},message:"must have required property '"+"durationMs"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key1 in data4){
if(!((key1 === "frame") || (key1 === "durationMs"))){
const err18 = {instancePath:instancePath+"/frames/" + i2,schemaPath:"#/$defs/idleFrame/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data4.frame !== undefined){
let data5 = data4.frame;
if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
const err19 = {instancePath:instancePath+"/frames/" + i2+"/frame",schemaPath:"#/$defs/idleFrame/properties/frame/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if((typeof data5 == "number") && (isFinite(data5))){
if(data5 > 511 || isNaN(data5)){
const err20 = {instancePath:instancePath+"/frames/" + i2+"/frame",schemaPath:"#/$defs/idleFrame/properties/frame/maximum",keyword:"maximum",params:{comparison: "<=", limit: 511},message:"must be <= 511"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data5 < 0 || isNaN(data5)){
const err21 = {instancePath:instancePath+"/frames/" + i2+"/frame",schemaPath:"#/$defs/idleFrame/properties/frame/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
}
if(data4.durationMs !== undefined){
let data6 = data4.durationMs;
if(!(((typeof data6 == "number") && (!(data6 % 1) && !isNaN(data6))) && (isFinite(data6)))){
const err22 = {instancePath:instancePath+"/frames/" + i2+"/durationMs",schemaPath:"#/$defs/idleFrame/properties/durationMs/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 > 5000 || isNaN(data6)){
const err23 = {instancePath:instancePath+"/frames/" + i2+"/durationMs",schemaPath:"#/$defs/idleFrame/properties/durationMs/maximum",keyword:"maximum",params:{comparison: "<=", limit: 5000},message:"must be <= 5000"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(data6 < 16 || isNaN(data6)){
const err24 = {instancePath:instancePath+"/frames/" + i2+"/durationMs",schemaPath:"#/$defs/idleFrame/properties/durationMs/minimum",keyword:"minimum",params:{comparison: ">=", limit: 16},message:"must be >= 16"};
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
}
else {
const err25 = {instancePath:instancePath+"/frames/" + i2,schemaPath:"#/$defs/idleFrame/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
}
else {
const err26 = {instancePath:instancePath+"/frames",schemaPath:"#/properties/frames/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data.minimumDelayMs !== undefined){
let data7 = data.minimumDelayMs;
if(!(((typeof data7 == "number") && (!(data7 % 1) && !isNaN(data7))) && (isFinite(data7)))){
const err27 = {instancePath:instancePath+"/minimumDelayMs",schemaPath:"#/properties/minimumDelayMs/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 > 120000 || isNaN(data7)){
const err28 = {instancePath:instancePath+"/minimumDelayMs",schemaPath:"#/properties/minimumDelayMs/maximum",keyword:"maximum",params:{comparison: "<=", limit: 120000},message:"must be <= 120000"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data7 < 250 || isNaN(data7)){
const err29 = {instancePath:instancePath+"/minimumDelayMs",schemaPath:"#/properties/minimumDelayMs/minimum",keyword:"minimum",params:{comparison: ">=", limit: 250},message:"must be >= 250"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
}
if(data.maximumDelayMs !== undefined){
let data8 = data.maximumDelayMs;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err30 = {instancePath:instancePath+"/maximumDelayMs",schemaPath:"#/properties/maximumDelayMs/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 > 120000 || isNaN(data8)){
const err31 = {instancePath:instancePath+"/maximumDelayMs",schemaPath:"#/properties/maximumDelayMs/maximum",keyword:"maximum",params:{comparison: "<=", limit: 120000},message:"must be <= 120000"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(data8 < 250 || isNaN(data8)){
const err32 = {instancePath:instancePath+"/maximumDelayMs",schemaPath:"#/properties/maximumDelayMs/minimum",keyword:"minimum",params:{comparison: ">=", limit: 250},message:"must be >= 250"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
}
}
else {
const err33 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
validate25.errors = vErrors;
return errors === 0;
}
validate25.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate22.evaluated;
if(evaluated0.dynamicProps){
evaluated0.props = undefined;
}
if(evaluated0.dynamicItems){
evaluated0.items = undefined;
}
const _errs0 = errors;
let valid0 = false;
let passing0 = null;
const _errs1 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err0 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.asset === undefined){
const err1 = {instancePath,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty: "asset"},message:"must have required property '"+"asset"+"'"};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "type") || (key0 === "asset")) || (key0 === "normalization")) || (key0 === "alphaThreshold"))){
const err2 = {instancePath,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
if(data.type !== undefined){
if("image" !== data.type){
const err3 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue: "image"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.asset !== undefined){
let data1 = data.asset;
if(typeof data1 === "string"){
if(func1(data1) > 180){
const err4 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!pattern6.test(data1)){
const err5 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
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
const err6 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.normalization !== undefined){
let data2 = data.normalization;
if(!((data2 === "preserve") || (data2 === "grounded"))){
const err7 = {instancePath:instancePath+"/normalization",schemaPath:"#/oneOf/0/properties/normalization/enum",keyword:"enum",params:{allowedValues: schema36.oneOf[0].properties.normalization.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.alphaThreshold !== undefined){
let data3 = data.alphaThreshold;
if(!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))){
const err8 = {instancePath:instancePath+"/alphaThreshold",schemaPath:"#/oneOf/0/properties/alphaThreshold/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if((typeof data3 == "number") && (isFinite(data3))){
if(data3 > 255 || isNaN(data3)){
const err9 = {instancePath:instancePath+"/alphaThreshold",schemaPath:"#/oneOf/0/properties/alphaThreshold/maximum",keyword:"maximum",params:{comparison: "<=", limit: 255},message:"must be <= 255"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
if(data3 < 0 || isNaN(data3)){
const err10 = {instancePath:instancePath+"/alphaThreshold",schemaPath:"#/oneOf/0/properties/alphaThreshold/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
}
}
else {
const err11 = {instancePath,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
var _valid0 = _errs1 === errors;
if(_valid0){
valid0 = true;
passing0 = 0;
var props0 = true;
}
const _errs11 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.type === undefined){
const err12 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "type"},message:"must have required property '"+"type"+"'"};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data.asset === undefined){
const err13 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "asset"},message:"must have required property '"+"asset"+"'"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
if(data.pages === undefined){
const err14 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "pages"},message:"must have required property '"+"pages"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data.columns === undefined){
const err15 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "columns"},message:"must have required property '"+"columns"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data.rows === undefined){
const err16 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "rows"},message:"must have required property '"+"rows"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data.framesPerPage === undefined){
const err17 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "framesPerPage"},message:"must have required property '"+"framesPerPage"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data.frameWidth === undefined){
const err18 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "frameWidth"},message:"must have required property '"+"frameWidth"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.frameHeight === undefined){
const err19 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "frameHeight"},message:"must have required property '"+"frameHeight"+"'"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data.directions === undefined){
const err20 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "directions"},message:"must have required property '"+"directions"+"'"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data.frameCount === undefined){
const err21 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "frameCount"},message:"must have required property '"+"frameCount"+"'"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
if(data.poses === undefined){
const err22 = {instancePath,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty: "poses"},message:"must have required property '"+"poses"+"'"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
for(const key1 in data){
if(!(func16.call(schema36.oneOf[1].properties, key1))){
const err23 = {instancePath,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
}
if(data.type !== undefined){
if("sprite-atlas" !== data.type){
const err24 = {instancePath:instancePath+"/type",schemaPath:"#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue: "sprite-atlas"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data.asset !== undefined){
let data5 = data.asset;
if(typeof data5 === "string"){
if(func1(data5) > 180){
const err25 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!pattern6.test(data5)){
const err26 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
else {
const err27 = {instancePath:instancePath+"/asset",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.pages !== undefined){
let data6 = data.pages;
if(Array.isArray(data6)){
if(data6.length > 8){
const err28 = {instancePath:instancePath+"/pages",schemaPath:"#/oneOf/1/properties/pages/maxItems",keyword:"maxItems",params:{limit: 8},message:"must NOT have more than 8 items"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data6.length < 1){
const err29 = {instancePath:instancePath+"/pages",schemaPath:"#/oneOf/1/properties/pages/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
const len0 = data6.length;
for(let i0=0; i0<len0; i0++){
let data7 = data6[i0];
if(typeof data7 === "string"){
if(func1(data7) > 180){
const err30 = {instancePath:instancePath+"/pages/" + i0,schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(!pattern6.test(data7)){
const err31 = {instancePath:instancePath+"/pages/" + i0,schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
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
const err32 = {instancePath:instancePath+"/pages/" + i0,schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
let i1 = data6.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data6[i1], data6[j0])){
const err33 = {instancePath:instancePath+"/pages",schemaPath:"#/oneOf/1/properties/pages/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err34 = {instancePath:instancePath+"/pages",schemaPath:"#/oneOf/1/properties/pages/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
if(data.columns !== undefined){
let data8 = data.columns;
if(!(((typeof data8 == "number") && (!(data8 % 1) && !isNaN(data8))) && (isFinite(data8)))){
const err35 = {instancePath:instancePath+"/columns",schemaPath:"#/oneOf/1/properties/columns/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
if((typeof data8 == "number") && (isFinite(data8))){
if(data8 > 16 || isNaN(data8)){
const err36 = {instancePath:instancePath+"/columns",schemaPath:"#/oneOf/1/properties/columns/maximum",keyword:"maximum",params:{comparison: "<=", limit: 16},message:"must be <= 16"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data8 < 1 || isNaN(data8)){
const err37 = {instancePath:instancePath+"/columns",schemaPath:"#/oneOf/1/properties/columns/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
}
if(data.rows !== undefined){
let data9 = data.rows;
if(!(((typeof data9 == "number") && (!(data9 % 1) && !isNaN(data9))) && (isFinite(data9)))){
const err38 = {instancePath:instancePath+"/rows",schemaPath:"#/oneOf/1/properties/rows/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if((typeof data9 == "number") && (isFinite(data9))){
if(data9 > 16 || isNaN(data9)){
const err39 = {instancePath:instancePath+"/rows",schemaPath:"#/oneOf/1/properties/rows/maximum",keyword:"maximum",params:{comparison: "<=", limit: 16},message:"must be <= 16"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data9 < 1 || isNaN(data9)){
const err40 = {instancePath:instancePath+"/rows",schemaPath:"#/oneOf/1/properties/rows/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
}
if(data.framesPerPage !== undefined){
let data10 = data.framesPerPage;
if(!(((typeof data10 == "number") && (!(data10 % 1) && !isNaN(data10))) && (isFinite(data10)))){
const err41 = {instancePath:instancePath+"/framesPerPage",schemaPath:"#/oneOf/1/properties/framesPerPage/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if((typeof data10 == "number") && (isFinite(data10))){
if(data10 > 256 || isNaN(data10)){
const err42 = {instancePath:instancePath+"/framesPerPage",schemaPath:"#/oneOf/1/properties/framesPerPage/maximum",keyword:"maximum",params:{comparison: "<=", limit: 256},message:"must be <= 256"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data10 < 1 || isNaN(data10)){
const err43 = {instancePath:instancePath+"/framesPerPage",schemaPath:"#/oneOf/1/properties/framesPerPage/minimum",keyword:"minimum",params:{comparison: ">=", limit: 1},message:"must be >= 1"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
}
if(data.frameWidth !== undefined){
let data11 = data.frameWidth;
if(!(((typeof data11 == "number") && (!(data11 % 1) && !isNaN(data11))) && (isFinite(data11)))){
const err44 = {instancePath:instancePath+"/frameWidth",schemaPath:"#/oneOf/1/properties/frameWidth/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 > 1024 || isNaN(data11)){
const err45 = {instancePath:instancePath+"/frameWidth",schemaPath:"#/oneOf/1/properties/frameWidth/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1024},message:"must be <= 1024"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data11 < 16 || isNaN(data11)){
const err46 = {instancePath:instancePath+"/frameWidth",schemaPath:"#/oneOf/1/properties/frameWidth/minimum",keyword:"minimum",params:{comparison: ">=", limit: 16},message:"must be >= 16"};
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
if(data.frameHeight !== undefined){
let data12 = data.frameHeight;
if(!(((typeof data12 == "number") && (!(data12 % 1) && !isNaN(data12))) && (isFinite(data12)))){
const err47 = {instancePath:instancePath+"/frameHeight",schemaPath:"#/oneOf/1/properties/frameHeight/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if((typeof data12 == "number") && (isFinite(data12))){
if(data12 > 1024 || isNaN(data12)){
const err48 = {instancePath:instancePath+"/frameHeight",schemaPath:"#/oneOf/1/properties/frameHeight/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1024},message:"must be <= 1024"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
if(data12 < 16 || isNaN(data12)){
const err49 = {instancePath:instancePath+"/frameHeight",schemaPath:"#/oneOf/1/properties/frameHeight/minimum",keyword:"minimum",params:{comparison: ">=", limit: 16},message:"must be >= 16"};
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
if(data.directions !== undefined){
let data13 = data.directions;
if(!(((typeof data13 == "number") && (!(data13 % 1) && !isNaN(data13))) && (isFinite(data13)))){
const err50 = {instancePath:instancePath+"/directions",schemaPath:"#/oneOf/1/properties/directions/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 512 || isNaN(data13)){
const err51 = {instancePath:instancePath+"/directions",schemaPath:"#/oneOf/1/properties/directions/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(data13 < 4 || isNaN(data13)){
const err52 = {instancePath:instancePath+"/directions",schemaPath:"#/oneOf/1/properties/directions/minimum",keyword:"minimum",params:{comparison: ">=", limit: 4},message:"must be >= 4"};
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
if(data.frameCount !== undefined){
let data14 = data.frameCount;
if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
const err53 = {instancePath:instancePath+"/frameCount",schemaPath:"#/oneOf/1/properties/frameCount/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 > 512 || isNaN(data14)){
const err54 = {instancePath:instancePath+"/frameCount",schemaPath:"#/oneOf/1/properties/frameCount/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
if(data14 < 4 || isNaN(data14)){
const err55 = {instancePath:instancePath+"/frameCount",schemaPath:"#/oneOf/1/properties/frameCount/minimum",keyword:"minimum",params:{comparison: ">=", limit: 4},message:"must be >= 4"};
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
if(data.poses !== undefined){
let data15 = data.poses;
if(Array.isArray(data15)){
if(data15.length > 512){
const err56 = {instancePath:instancePath+"/poses",schemaPath:"#/oneOf/1/properties/poses/maxItems",keyword:"maxItems",params:{limit: 512},message:"must NOT have more than 512 items"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data15.length < 4){
const err57 = {instancePath:instancePath+"/poses",schemaPath:"#/oneOf/1/properties/poses/minItems",keyword:"minItems",params:{limit: 4},message:"must NOT have fewer than 4 items"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
const len1 = data15.length;
for(let i2=0; i2<len1; i2++){
if(!(validate23(data15[i2], {instancePath:instancePath+"/poses/" + i2,parentData:data15,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
errors = vErrors.length;
}
}
}
else {
const err58 = {instancePath:instancePath+"/poses",schemaPath:"#/oneOf/1/properties/poses/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data.idleClips !== undefined){
let data17 = data.idleClips;
if(Array.isArray(data17)){
if(data17.length > 64){
const err59 = {instancePath:instancePath+"/idleClips",schemaPath:"#/oneOf/1/properties/idleClips/maxItems",keyword:"maxItems",params:{limit: 64},message:"must NOT have more than 64 items"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
const len2 = data17.length;
for(let i3=0; i3<len2; i3++){
if(!(validate25(data17[i3], {instancePath:instancePath+"/idleClips/" + i3,parentData:data17,parentDataProperty:i3,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
errors = vErrors.length;
}
}
}
else {
const err60 = {instancePath:instancePath+"/idleClips",schemaPath:"#/oneOf/1/properties/idleClips/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
if(data.neutralFrame !== undefined){
let data19 = data.neutralFrame;
if(!(((typeof data19 == "number") && (!(data19 % 1) && !isNaN(data19))) && (isFinite(data19)))){
const err61 = {instancePath:instancePath+"/neutralFrame",schemaPath:"#/oneOf/1/properties/neutralFrame/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
if((typeof data19 == "number") && (isFinite(data19))){
if(data19 > 511 || isNaN(data19)){
const err62 = {instancePath:instancePath+"/neutralFrame",schemaPath:"#/oneOf/1/properties/neutralFrame/maximum",keyword:"maximum",params:{comparison: "<=", limit: 511},message:"must be <= 511"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(data19 < 0 || isNaN(data19)){
const err63 = {instancePath:instancePath+"/neutralFrame",schemaPath:"#/oneOf/1/properties/neutralFrame/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
if(data.reducedMotionFrame !== undefined){
let data20 = data.reducedMotionFrame;
if(!(((typeof data20 == "number") && (!(data20 % 1) && !isNaN(data20))) && (isFinite(data20)))){
const err64 = {instancePath:instancePath+"/reducedMotionFrame",schemaPath:"#/oneOf/1/properties/reducedMotionFrame/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if((typeof data20 == "number") && (isFinite(data20))){
if(data20 > 511 || isNaN(data20)){
const err65 = {instancePath:instancePath+"/reducedMotionFrame",schemaPath:"#/oneOf/1/properties/reducedMotionFrame/maximum",keyword:"maximum",params:{comparison: "<=", limit: 511},message:"must be <= 511"};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(data20 < 0 || isNaN(data20)){
const err66 = {instancePath:instancePath+"/reducedMotionFrame",schemaPath:"#/oneOf/1/properties/reducedMotionFrame/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
}
if(data.transitionFps !== undefined){
let data21 = data.transitionFps;
if(!(((typeof data21 == "number") && (!(data21 % 1) && !isNaN(data21))) && (isFinite(data21)))){
const err67 = {instancePath:instancePath+"/transitionFps",schemaPath:"#/oneOf/1/properties/transitionFps/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
if((typeof data21 == "number") && (isFinite(data21))){
if(data21 > 60 || isNaN(data21)){
const err68 = {instancePath:instancePath+"/transitionFps",schemaPath:"#/oneOf/1/properties/transitionFps/maximum",keyword:"maximum",params:{comparison: "<=", limit: 60},message:"must be <= 60"};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
if(data21 < 12 || isNaN(data21)){
const err69 = {instancePath:instancePath+"/transitionFps",schemaPath:"#/oneOf/1/properties/transitionFps/minimum",keyword:"minimum",params:{comparison: ">=", limit: 12},message:"must be >= 12"};
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
if(data.followSmoothing !== undefined){
let data22 = data.followSmoothing;
if((typeof data22 == "number") && (isFinite(data22))){
if(data22 > 1 || isNaN(data22)){
const err70 = {instancePath:instancePath+"/followSmoothing",schemaPath:"#/oneOf/1/properties/followSmoothing/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
if(data22 < 0.02 || isNaN(data22)){
const err71 = {instancePath:instancePath+"/followSmoothing",schemaPath:"#/oneOf/1/properties/followSmoothing/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0.02},message:"must be >= 0.02"};
if(vErrors === null){
vErrors = [err71];
}
else {
vErrors.push(err71);
}
errors++;
}
}
else {
const err72 = {instancePath:instancePath+"/followSmoothing",schemaPath:"#/oneOf/1/properties/followSmoothing/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err72];
}
else {
vErrors.push(err72);
}
errors++;
}
}
if(data.normalization !== undefined){
let data23 = data.normalization;
if(!((data23 === "preserve") || (data23 === "grounded"))){
const err73 = {instancePath:instancePath+"/normalization",schemaPath:"#/oneOf/1/properties/normalization/enum",keyword:"enum",params:{allowedValues: schema36.oneOf[1].properties.normalization.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err73];
}
else {
vErrors.push(err73);
}
errors++;
}
}
if(data.alphaThreshold !== undefined){
let data24 = data.alphaThreshold;
if(!(((typeof data24 == "number") && (!(data24 % 1) && !isNaN(data24))) && (isFinite(data24)))){
const err74 = {instancePath:instancePath+"/alphaThreshold",schemaPath:"#/oneOf/1/properties/alphaThreshold/type",keyword:"type",params:{type: "integer"},message:"must be integer"};
if(vErrors === null){
vErrors = [err74];
}
else {
vErrors.push(err74);
}
errors++;
}
if((typeof data24 == "number") && (isFinite(data24))){
if(data24 > 255 || isNaN(data24)){
const err75 = {instancePath:instancePath+"/alphaThreshold",schemaPath:"#/oneOf/1/properties/alphaThreshold/maximum",keyword:"maximum",params:{comparison: "<=", limit: 255},message:"must be <= 255"};
if(vErrors === null){
vErrors = [err75];
}
else {
vErrors.push(err75);
}
errors++;
}
if(data24 < 0 || isNaN(data24)){
const err76 = {instancePath:instancePath+"/alphaThreshold",schemaPath:"#/oneOf/1/properties/alphaThreshold/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err76];
}
else {
vErrors.push(err76);
}
errors++;
}
}
}
}
else {
const err77 = {instancePath,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err77];
}
else {
vErrors.push(err77);
}
errors++;
}
var _valid0 = _errs11 === errors;
if(_valid0 && valid0){
valid0 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid0 = true;
passing0 = 1;
if(props0 !== true){
props0 = true;
}
}
}
if(!valid0){
const err78 = {instancePath,schemaPath:"#/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
if(vErrors === null){
vErrors = [err78];
}
else {
vErrors.push(err78);
}
errors++;
}
else {
errors = _errs0;
if(vErrors !== null){
if(_errs0){
vErrors.length = _errs0;
}
else {
vErrors = null;
}
}
}
validate22.errors = vErrors;
evaluated0.props = props0;
return errors === 0;
}
validate22.evaluated = {"dynamicProps":true,"dynamicItems":false};


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
if(!pattern8.test(data0)){
const err8 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/localId/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
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
const err9 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/localId/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(func1(data1) > 64){
const err10 = {instancePath:instancePath+"/name",schemaPath:"#/properties/name/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(func1(data1) < 1){
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
if(!(validate22(data.renderer, {instancePath:instancePath+"/renderer",parentData:data,parentDataProperty:"renderer",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
errors = vErrors.length;
}
}
if(data.behaviors !== undefined){
let data3 = data.behaviors;
if(Array.isArray(data3)){
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
let data4 = data3[i0];
if(!((((data4 === "idle") || (data4 === "parallax")) || (data4 === "look-at-pointer")) || (data4 === "reduce-motion-fallback"))){
const err13 = {instancePath:instancePath+"/behaviors/" + i0,schemaPath:"#/properties/behaviors/items/enum",keyword:"enum",params:{allowedValues: schema34.properties.behaviors.items.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
let i1 = data3.length;
let j0;
if(i1 > 1){
outer0:
for(;i1--;){
for(j0 = i1; j0--;){
if(func0(data3[i1], data3[j0])){
const err14 = {instancePath:instancePath+"/behaviors",schemaPath:"#/properties/behaviors/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
break outer0;
}
}
}
}
}
else {
const err15 = {instancePath:instancePath+"/behaviors",schemaPath:"#/properties/behaviors/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data.anchor !== undefined){
let data5 = data.anchor;
if(data5 && typeof data5 == "object" && !Array.isArray(data5)){
if(data5.x === undefined){
const err16 = {instancePath:instancePath+"/anchor",schemaPath:"#/properties/anchor/required",keyword:"required",params:{missingProperty: "x"},message:"must have required property '"+"x"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data5.y === undefined){
const err17 = {instancePath:instancePath+"/anchor",schemaPath:"#/properties/anchor/required",keyword:"required",params:{missingProperty: "y"},message:"must have required property '"+"y"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
for(const key1 in data5){
if(!((key1 === "x") || (key1 === "y"))){
const err18 = {instancePath:instancePath+"/anchor",schemaPath:"#/properties/anchor/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data5.x !== undefined){
let data6 = data5.x;
if((typeof data6 == "number") && (isFinite(data6))){
if(data6 > 100 || isNaN(data6)){
const err19 = {instancePath:instancePath+"/anchor/x",schemaPath:"#/properties/anchor/properties/x/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data6 < 0 || isNaN(data6)){
const err20 = {instancePath:instancePath+"/anchor/x",schemaPath:"#/properties/anchor/properties/x/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
const err21 = {instancePath:instancePath+"/anchor/x",schemaPath:"#/properties/anchor/properties/x/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data5.y !== undefined){
let data7 = data5.y;
if((typeof data7 == "number") && (isFinite(data7))){
if(data7 > 100 || isNaN(data7)){
const err22 = {instancePath:instancePath+"/anchor/y",schemaPath:"#/properties/anchor/properties/y/maximum",keyword:"maximum",params:{comparison: "<=", limit: 100},message:"must be <= 100"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
if(data7 < 0 || isNaN(data7)){
const err23 = {instancePath:instancePath+"/anchor/y",schemaPath:"#/properties/anchor/properties/y/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
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
const err24 = {instancePath:instancePath+"/anchor/y",schemaPath:"#/properties/anchor/properties/y/type",keyword:"type",params:{type: "number"},message:"must be number"};
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
const err25 = {instancePath:instancePath+"/anchor",schemaPath:"#/properties/anchor/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data.attachment !== undefined){
let data8 = data.attachment;
if(data8 && typeof data8 == "object" && !Array.isArray(data8)){
if(data8.target === undefined){
const err26 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/required",keyword:"required",params:{missingProperty: "target"},message:"must have required property '"+"target"+"'"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data8.edge === undefined){
const err27 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/required",keyword:"required",params:{missingProperty: "edge"},message:"must have required property '"+"edge"+"'"};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
if(data8.align === undefined){
const err28 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/required",keyword:"required",params:{missingProperty: "align"},message:"must have required property '"+"align"+"'"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(data8.offset === undefined){
const err29 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/required",keyword:"required",params:{missingProperty: "offset"},message:"must have required property '"+"offset"+"'"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
for(const key2 in data8){
if(!((((key2 === "target") || (key2 === "edge")) || (key2 === "align")) || (key2 === "offset"))){
const err30 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data8.target !== undefined){
let data9 = data8.target;
if(!(((data9 === "composer") || (data9 === "main-surface")) || (data9 === "thread-summary"))){
const err31 = {instancePath:instancePath+"/attachment/target",schemaPath:"#/properties/attachment/properties/target/enum",keyword:"enum",params:{allowedValues: schema34.properties.attachment.properties.target.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data8.edge !== undefined){
let data10 = data8.edge;
if(!((data10 === "top") || (data10 === "bottom"))){
const err32 = {instancePath:instancePath+"/attachment/edge",schemaPath:"#/properties/attachment/properties/edge/enum",keyword:"enum",params:{allowedValues: schema34.properties.attachment.properties.edge.enum},message:"must be equal to one of the allowed values"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data8.align !== undefined){
let data11 = data8.align;
if((typeof data11 == "number") && (isFinite(data11))){
if(data11 > 1 || isNaN(data11)){
const err33 = {instancePath:instancePath+"/attachment/align",schemaPath:"#/properties/attachment/properties/align/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data11 < 0 || isNaN(data11)){
const err34 = {instancePath:instancePath+"/attachment/align",schemaPath:"#/properties/attachment/properties/align/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
else {
const err35 = {instancePath:instancePath+"/attachment/align",schemaPath:"#/properties/attachment/properties/align/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data8.offset !== undefined){
let data12 = data8.offset;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.x === undefined){
const err36 = {instancePath:instancePath+"/attachment/offset",schemaPath:"#/properties/attachment/properties/offset/required",keyword:"required",params:{missingProperty: "x"},message:"must have required property '"+"x"+"'"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data12.y === undefined){
const err37 = {instancePath:instancePath+"/attachment/offset",schemaPath:"#/properties/attachment/properties/offset/required",keyword:"required",params:{missingProperty: "y"},message:"must have required property '"+"y"+"'"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
for(const key3 in data12){
if(!((key3 === "x") || (key3 === "y"))){
const err38 = {instancePath:instancePath+"/attachment/offset",schemaPath:"#/properties/attachment/properties/offset/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
if(data12.x !== undefined){
let data13 = data12.x;
if((typeof data13 == "number") && (isFinite(data13))){
if(data13 > 512 || isNaN(data13)){
const err39 = {instancePath:instancePath+"/attachment/offset/x",schemaPath:"#/properties/attachment/properties/offset/properties/x/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data13 < -512 || isNaN(data13)){
const err40 = {instancePath:instancePath+"/attachment/offset/x",schemaPath:"#/properties/attachment/properties/offset/properties/x/minimum",keyword:"minimum",params:{comparison: ">=", limit: -512},message:"must be >= -512"};
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
const err41 = {instancePath:instancePath+"/attachment/offset/x",schemaPath:"#/properties/attachment/properties/offset/properties/x/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
}
if(data12.y !== undefined){
let data14 = data12.y;
if((typeof data14 == "number") && (isFinite(data14))){
if(data14 > 512 || isNaN(data14)){
const err42 = {instancePath:instancePath+"/attachment/offset/y",schemaPath:"#/properties/attachment/properties/offset/properties/y/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
if(data14 < -512 || isNaN(data14)){
const err43 = {instancePath:instancePath+"/attachment/offset/y",schemaPath:"#/properties/attachment/properties/offset/properties/y/minimum",keyword:"minimum",params:{comparison: ">=", limit: -512},message:"must be >= -512"};
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
const err44 = {instancePath:instancePath+"/attachment/offset/y",schemaPath:"#/properties/attachment/properties/offset/properties/y/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
}
else {
const err45 = {instancePath:instancePath+"/attachment/offset",schemaPath:"#/properties/attachment/properties/offset/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
}
}
else {
const err46 = {instancePath:instancePath+"/attachment",schemaPath:"#/properties/attachment/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data.size !== undefined){
let data15 = data.size;
if((typeof data15 == "number") && (isFinite(data15))){
if(data15 > 512 || isNaN(data15)){
const err47 = {instancePath:instancePath+"/size",schemaPath:"#/properties/size/maximum",keyword:"maximum",params:{comparison: "<=", limit: 512},message:"must be <= 512"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
if(data15 < 24 || isNaN(data15)){
const err48 = {instancePath:instancePath+"/size",schemaPath:"#/properties/size/minimum",keyword:"minimum",params:{comparison: ">=", limit: 24},message:"must be >= 24"};
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
const err49 = {instancePath:instancePath+"/size",schemaPath:"#/properties/size/type",keyword:"type",params:{type: "number"},message:"must be number"};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
if(data.opacity !== undefined){
let data16 = data.opacity;
if((typeof data16 == "number") && (isFinite(data16))){
if(data16 > 1 || isNaN(data16)){
const err50 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/maximum",keyword:"maximum",params:{comparison: "<=", limit: 1},message:"must be <= 1"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data16 < 0 || isNaN(data16)){
const err51 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/minimum",keyword:"minimum",params:{comparison: ">=", limit: 0},message:"must be >= 0"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
else {
const err52 = {instancePath:instancePath+"/opacity",schemaPath:"#/properties/opacity/type",keyword:"type",params:{type: "number"},message:"must be number"};
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
else {
const err53 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}
validate21.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};

const schema46 = {"type":"object","additionalProperties":false,"required":["id","path","type","license"],"properties":{"id":{"$ref":"#/$defs/localId"},"path":{"$ref":"#/$defs/assetPath"},"type":{"enum":["image","sprite-atlas","preview"]},"license":{"type":"string","minLength":1,"maxLength":64}}};

function validate29(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
let vErrors = null;
let errors = 0;
const evaluated0 = validate29.evaluated;
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
if(!pattern8.test(data0)){
const err5 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/localId/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9-]{1,39}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9-]{1,39}$"+"\""};
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
const err6 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/localId/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
if(func1(data1) > 180){
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
if(!(((data2 === "image") || (data2 === "sprite-atlas")) || (data2 === "preview"))){
const err10 = {instancePath:instancePath+"/type",schemaPath:"#/properties/type/enum",keyword:"enum",params:{allowedValues: schema46.properties.type.enum},message:"must be equal to one of the allowed values"};
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
if(func1(data3) > 64){
const err11 = {instancePath:instancePath+"/license",schemaPath:"#/properties/license/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
if(func1(data3) < 1){
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
validate29.errors = vErrors;
return errors === 0;
}
validate29.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};


function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data, dynamicAnchors={}}={}){
/*# sourceURL="https://xuhuanstudio.github.io/codex-styler/schema/companion-v1.json" */;
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
if(data.entity === undefined){
const err5 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "entity"},message:"must have required property '"+"entity"+"'"};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.assets === undefined){
const err6 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "assets"},message:"must have required property '"+"assets"+"'"};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(data.locales === undefined){
const err7 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "locales"},message:"must have required property '"+"locales"+"'"};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
for(const key0 in data){
if(!((((((((key0 === "format") || (key0 === "id")) || (key0 === "version")) || (key0 === "metadata")) || (key0 === "compatibility")) || (key0 === "entity")) || (key0 === "assets")) || (key0 === "locales"))){
const err8 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.format !== undefined){
if("codex-styler-companion-v1" !== data.format){
const err9 = {instancePath:instancePath+"/format",schemaPath:"#/properties/format/const",keyword:"const",params:{allowedValue: "codex-styler-companion-v1"},message:"must be equal to constant"};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.id !== undefined){
let data1 = data.id;
if(typeof data1 === "string"){
if(!pattern4.test(data1)){
const err10 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/packageId/pattern",keyword:"pattern",params:{pattern: "^[a-z0-9][a-z0-9.-]{2,63}$"},message:"must match pattern \""+"^[a-z0-9][a-z0-9.-]{2,63}$"+"\""};
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
const err11 = {instancePath:instancePath+"/id",schemaPath:"#/$defs/packageId/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.version !== undefined){
let data2 = data.version;
if(typeof data2 === "string"){
if(!pattern5.test(data2)){
const err12 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/pattern",keyword:"pattern",params:{pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$"},message:"must match pattern \""+"^[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$"+"\""};
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
const err13 = {instancePath:instancePath+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data.metadata !== undefined){
let data3 = data.metadata;
if(data3 && typeof data3 == "object" && !Array.isArray(data3)){
if(data3.name === undefined){
const err14 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(data3.description === undefined){
const err15 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
if(data3.author === undefined){
const err16 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "author"},message:"must have required property '"+"author"+"'"};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
if(data3.license === undefined){
const err17 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "license"},message:"must have required property '"+"license"+"'"};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
if(data3.tags === undefined){
const err18 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/required",keyword:"required",params:{missingProperty: "tags"},message:"must have required property '"+"tags"+"'"};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
for(const key1 in data3){
if(!(((((((key1 === "name") || (key1 === "description")) || (key1 === "author")) || (key1 === "license")) || (key1 === "tags")) || (key1 === "homepage")) || (key1 === "preview"))){
const err19 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data3.name !== undefined){
let data4 = data3.name;
if(typeof data4 === "string"){
if(func1(data4) > 64){
const err20 = {instancePath:instancePath+"/metadata/name",schemaPath:"#/properties/metadata/properties/name/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(func1(data4) < 1){
const err21 = {instancePath:instancePath+"/metadata/name",schemaPath:"#/properties/metadata/properties/name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
else {
const err22 = {instancePath:instancePath+"/metadata/name",schemaPath:"#/properties/metadata/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data3.description !== undefined){
let data5 = data3.description;
if(typeof data5 === "string"){
if(func1(data5) > 240){
const err23 = {instancePath:instancePath+"/metadata/description",schemaPath:"#/properties/metadata/properties/description/maxLength",keyword:"maxLength",params:{limit: 240},message:"must NOT have more than 240 characters"};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(func1(data5) < 1){
const err24 = {instancePath:instancePath+"/metadata/description",schemaPath:"#/properties/metadata/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
else {
const err25 = {instancePath:instancePath+"/metadata/description",schemaPath:"#/properties/metadata/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
}
if(data3.author !== undefined){
let data6 = data3.author;
if(typeof data6 === "string"){
if(func1(data6) > 80){
const err26 = {instancePath:instancePath+"/metadata/author",schemaPath:"#/properties/metadata/properties/author/maxLength",keyword:"maxLength",params:{limit: 80},message:"must NOT have more than 80 characters"};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(func1(data6) < 1){
const err27 = {instancePath:instancePath+"/metadata/author",schemaPath:"#/properties/metadata/properties/author/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err28 = {instancePath:instancePath+"/metadata/author",schemaPath:"#/properties/metadata/properties/author/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
}
if(data3.license !== undefined){
let data7 = data3.license;
if(typeof data7 === "string"){
if(func1(data7) > 64){
const err29 = {instancePath:instancePath+"/metadata/license",schemaPath:"#/properties/metadata/properties/license/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
if(func1(data7) < 1){
const err30 = {instancePath:instancePath+"/metadata/license",schemaPath:"#/properties/metadata/properties/license/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
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
const err31 = {instancePath:instancePath+"/metadata/license",schemaPath:"#/properties/metadata/properties/license/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data3.tags !== undefined){
let data8 = data3.tags;
if(Array.isArray(data8)){
if(data8.length > 12){
const err32 = {instancePath:instancePath+"/metadata/tags",schemaPath:"#/properties/metadata/properties/tags/maxItems",keyword:"maxItems",params:{limit: 12},message:"must NOT have more than 12 items"};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
const len0 = data8.length;
for(let i0=0; i0<len0; i0++){
let data9 = data8[i0];
if(typeof data9 === "string"){
if(func1(data9) > 32){
const err33 = {instancePath:instancePath+"/metadata/tags/" + i0,schemaPath:"#/properties/metadata/properties/tags/items/maxLength",keyword:"maxLength",params:{limit: 32},message:"must NOT have more than 32 characters"};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(func1(data9) < 1){
const err34 = {instancePath:instancePath+"/metadata/tags/" + i0,schemaPath:"#/properties/metadata/properties/tags/items/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
}
else {
const err35 = {instancePath:instancePath+"/metadata/tags/" + i0,schemaPath:"#/properties/metadata/properties/tags/items/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
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
const err36 = {instancePath:instancePath+"/metadata/tags",schemaPath:"#/properties/metadata/properties/tags/uniqueItems",keyword:"uniqueItems",params:{i: i1, j: j0},message:"must NOT have duplicate items (items ## "+j0+" and "+i1+" are identical)"};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
break;
}
indices0[item0] = i1;
}
}
}
else {
const err37 = {instancePath:instancePath+"/metadata/tags",schemaPath:"#/properties/metadata/properties/tags/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
if(data3.homepage !== undefined){
let data10 = data3.homepage;
if(typeof data10 === "string"){
if(func1(data10) > 240){
const err38 = {instancePath:instancePath+"/metadata/homepage",schemaPath:"#/properties/metadata/properties/homepage/maxLength",keyword:"maxLength",params:{limit: 240},message:"must NOT have more than 240 characters"};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
if(!(formats0(data10))){
const err39 = {instancePath:instancePath+"/metadata/homepage",schemaPath:"#/properties/metadata/properties/homepage/format",keyword:"format",params:{format: "uri"},message:"must match format \""+"uri"+"\""};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
}
else {
const err40 = {instancePath:instancePath+"/metadata/homepage",schemaPath:"#/properties/metadata/properties/homepage/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data3.preview !== undefined){
let data11 = data3.preview;
if(typeof data11 === "string"){
if(func1(data11) > 180){
const err41 = {instancePath:instancePath+"/metadata/preview",schemaPath:"#/$defs/assetPath/maxLength",keyword:"maxLength",params:{limit: 180},message:"must NOT have more than 180 characters"};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(!pattern6.test(data11)){
const err42 = {instancePath:instancePath+"/metadata/preview",schemaPath:"#/$defs/assetPath/pattern",keyword:"pattern",params:{pattern: "^(assets|previews)/[A-Za-z0-9._/-]+$"},message:"must match pattern \""+"^(assets|previews)/[A-Za-z0-9._/-]+$"+"\""};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
else {
const err43 = {instancePath:instancePath+"/metadata/preview",schemaPath:"#/$defs/assetPath/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
}
else {
const err44 = {instancePath:instancePath+"/metadata",schemaPath:"#/properties/metadata/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.compatibility !== undefined){
let data12 = data.compatibility;
if(data12 && typeof data12 == "object" && !Array.isArray(data12)){
if(data12.styler === undefined){
const err45 = {instancePath:instancePath+"/compatibility",schemaPath:"#/properties/compatibility/required",keyword:"required",params:{missingProperty: "styler"},message:"must have required property '"+"styler"+"'"};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
for(const key2 in data12){
if(!(key2 === "styler")){
const err46 = {instancePath:instancePath+"/compatibility",schemaPath:"#/properties/compatibility/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
if(data12.styler !== undefined){
let data13 = data12.styler;
if(data13 && typeof data13 == "object" && !Array.isArray(data13)){
if(data13.minimumVersion === undefined){
const err47 = {instancePath:instancePath+"/compatibility/styler",schemaPath:"#/properties/compatibility/properties/styler/required",keyword:"required",params:{missingProperty: "minimumVersion"},message:"must have required property '"+"minimumVersion"+"'"};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
for(const key3 in data13){
if(!(key3 === "minimumVersion")){
const err48 = {instancePath:instancePath+"/compatibility/styler",schemaPath:"#/properties/compatibility/properties/styler/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data13.minimumVersion !== undefined){
let data14 = data13.minimumVersion;
if(typeof data14 === "string"){
if(!pattern7.test(data14)){
const err49 = {instancePath:instancePath+"/compatibility/styler/minimumVersion",schemaPath:"#/properties/compatibility/properties/styler/properties/minimumVersion/pattern",keyword:"pattern",params:{pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+"},message:"must match pattern \""+"^[0-9]+\\.[0-9]+\\.[0-9]+"+"\""};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
else {
const err50 = {instancePath:instancePath+"/compatibility/styler/minimumVersion",schemaPath:"#/properties/compatibility/properties/styler/properties/minimumVersion/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
}
else {
const err51 = {instancePath:instancePath+"/compatibility/styler",schemaPath:"#/properties/compatibility/properties/styler/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
}
else {
const err52 = {instancePath:instancePath+"/compatibility",schemaPath:"#/properties/compatibility/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data.entity !== undefined){
if(!(validate21(data.entity, {instancePath:instancePath+"/entity",parentData:data,parentDataProperty:"entity",rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
errors = vErrors.length;
}
}
if(data.assets !== undefined){
let data16 = data.assets;
if(Array.isArray(data16)){
if(data16.length > 16){
const err53 = {instancePath:instancePath+"/assets",schemaPath:"#/properties/assets/maxItems",keyword:"maxItems",params:{limit: 16},message:"must NOT have more than 16 items"};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
if(data16.length < 1){
const err54 = {instancePath:instancePath+"/assets",schemaPath:"#/properties/assets/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
const len1 = data16.length;
for(let i2=0; i2<len1; i2++){
if(!(validate29(data16[i2], {instancePath:instancePath+"/assets/" + i2,parentData:data16,parentDataProperty:i2,rootData,dynamicAnchors}))){
vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
errors = vErrors.length;
}
}
}
else {
const err55 = {instancePath:instancePath+"/assets",schemaPath:"#/properties/assets/type",keyword:"type",params:{type: "array"},message:"must be array"};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
}
if(data.locales !== undefined){
let data18 = data.locales;
if(data18 && typeof data18 == "object" && !Array.isArray(data18)){
for(const key4 in data18){
let data19 = data18[key4];
if(data19 && typeof data19 == "object" && !Array.isArray(data19)){
if(data19.name === undefined){
const err56 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/locales/additionalProperties/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'"};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
if(data19.description === undefined){
const err57 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/locales/additionalProperties/required",keyword:"required",params:{missingProperty: "description"},message:"must have required property '"+"description"+"'"};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
for(const key5 in data19){
if(!((key5 === "name") || (key5 === "description"))){
const err58 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/locales/additionalProperties/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key5},message:"must NOT have additional properties"};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data19.name !== undefined){
let data20 = data19.name;
if(typeof data20 === "string"){
if(func1(data20) > 64){
const err59 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1")+"/name",schemaPath:"#/properties/locales/additionalProperties/properties/name/maxLength",keyword:"maxLength",params:{limit: 64},message:"must NOT have more than 64 characters"};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(func1(data20) < 1){
const err60 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1")+"/name",schemaPath:"#/properties/locales/additionalProperties/properties/name/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
else {
const err61 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1")+"/name",schemaPath:"#/properties/locales/additionalProperties/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data19.description !== undefined){
let data21 = data19.description;
if(typeof data21 === "string"){
if(func1(data21) > 240){
const err62 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1")+"/description",schemaPath:"#/properties/locales/additionalProperties/properties/description/maxLength",keyword:"maxLength",params:{limit: 240},message:"must NOT have more than 240 characters"};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
if(func1(data21) < 1){
const err63 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1")+"/description",schemaPath:"#/properties/locales/additionalProperties/properties/description/minLength",keyword:"minLength",params:{limit: 1},message:"must NOT have fewer than 1 characters"};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
else {
const err64 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1")+"/description",schemaPath:"#/properties/locales/additionalProperties/properties/description/type",keyword:"type",params:{type: "string"},message:"must be string"};
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
const err65 = {instancePath:instancePath+"/locales/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/locales/additionalProperties/type",keyword:"type",params:{type: "object"},message:"must be object"};
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
const err66 = {instancePath:instancePath+"/locales",schemaPath:"#/properties/locales/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
}
else {
const err67 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
validate20.errors = vErrors;
return errors === 0;
}
validate20.evaluated = {"props":true,"dynamicProps":false,"dynamicItems":false};
