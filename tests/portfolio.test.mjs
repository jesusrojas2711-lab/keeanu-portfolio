import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
const require = createRequire(import.meta.url);
const cache = new Map();
function load(name) {
 if(cache.has(name)) return cache.get(name);
 const source=readFileSync(new URL(`../app/_lib/${name}.ts`,import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
 const loadedModule={exports:{}};
 vm.runInNewContext(outputText,{module:loadedModule,exports:loadedModule.exports,Buffer,URL,Response,Request,TextDecoder,Uint8Array,process,
  require(path){if(path==='server-only')return {};if(path.startsWith('./'))return load(path.slice(2));return require(path);}
 });
 cache.set(name,loadedModule.exports);return loadedModule.exports;
}
const http=load('http');const validation=load('portfolio-validation');const {optimizePhoto}=load('images');
const valid={title:'A wedding',slug:'a-wedding',category:'weddings',description:'',sort_order:0};
test('new project input rejects permission/status/ID injection',()=>{
 for(const field of ['status','id','role','created_at']) assert.throws(()=>validation.projectInput({...valid,[field]:'admin'}));
 assert.equal(validation.projectInput(valid).slug,'a-wedding');
});
test('invalid category, traversal slug and out-of-range order are rejected',()=>{
 for(const input of [{...valid,category:'admin'},{...valid,slug:'../../x'},{...valid,sort_order:-1},{...valid,sort_order:0.5}]) assert.throws(()=>validation.projectInput(input));
});
test('body reader enforces byte limit even if declared size is false',async()=>{
 const request=new Request('http://localhost',{method:'POST',headers:{'content-length':'1'},body:'a'.repeat(50)});
 await assert.rejects(http.readBody(request,10),e=>e.status===413);
});
test('bad JSON and incorrect content types fail safely',async()=>{
 await assert.rejects(http.readJson(new Request('http://localhost',{method:'POST',body:'{}'})),e=>e.status===415);
 await assert.rejects(http.readJson(new Request('http://localhost',{method:'POST',headers:{'content-type':'application/json'},body:'{'})),e=>e.status===400);
});
test('origin must match configured canonical origin',()=>{
 const previous=process.env.SITE_URL;process.env.SITE_URL='http://localhost:3000';
 try{assert.throws(()=>http.checkOrigin(new Request('http://localhost:3000',{headers:{origin:'https://evil.example'}})),e=>e.status===403);http.checkOrigin(new Request('http://localhost:3000',{headers:{origin:'http://localhost:3000'}}));}
 finally{if(previous===undefined)delete process.env.SITE_URL;else process.env.SITE_URL=previous;}
});
test('real JPEG is optimized and EXIF/XMP removed',async()=>{
 const input=await sharp({create:{width:2600,height:100,channels:3,background:'#ff6600'}}).jpeg().withMetadata().toBuffer();
 assert.ok((await sharp(input).metadata()).exif);
 const output=await optimizePhoto(input);const metadata=await sharp(output).metadata();
 assert.equal(metadata.format,'webp');assert.equal(metadata.width,2400);assert.equal(metadata.exif,undefined);assert.equal(metadata.xmp,undefined);
});
test('SVG, disguised content and truncated images are rejected',async()=>{
 for(const input of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),Buffer.from('not a picture'),Buffer.from([255,216,255,0])]) await assert.rejects(optimizePhoto(input),e=>e.status===415);
});
test('oversized photos are rejected before decoding',async()=>{
 await assert.rejects(optimizePhoto(new Uint8Array(4*1024*1024+1)),e=>e.status===413);
});
