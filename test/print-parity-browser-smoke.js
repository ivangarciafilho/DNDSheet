import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

const PAPER_POINTS = [210 * 72 / 25.4, 297 * 72 / 25.4]
const witnessImage = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#24466f"/></svg>')

await browserProbe(async ({ evaluate, send, delay }) => {
 const setup = await evaluate(`(async()=>{
  const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,e=p._s.get('editor'),m=p._s.get('monster');
  m.$reset();e.activeMode='monster';e.visualTheme='wotc';e.visualTemplate='modern';e.style='2024';m.name='A4 print parity witness';
  e.a4PreviewMode=true;e.a4Layout='statblock_only';e.a4Zoom=65;e.a4Orientation='portrait';e.a4CompactDensity=false;
  e.a4Layers=[{id:'front',type:'foreground',name:'Front',url:${JSON.stringify(witnessImage)},opacity:36,blendMode:'screen',visible:true,offsetX:4,offsetY:2,scale:98,showTextOverlay:true,overlayText:'Layer witness',gradientOverlay:{enabled:true,opacity:50,stops:[{color:'#613421',offset:0},{color:'#395d75',offset:100}]}},{id:'statblock_layer',type:'statblock',name:'Stat Block',opacity:92,blendMode:'normal',visible:true,scale:100,locked:true},{id:'back',type:'background',name:'Back',url:${JSON.stringify(witnessImage)},opacity:68,blendMode:'multiply',visible:true}];
  await document.fonts.ready;
  window.__printParitySnapshot=()=>{
   const sheet=document.querySelector('.a4-page-sheet'), block=document.querySelector('#render .statblock'), stage=document.querySelector('.a4-scale-stage');
   const wrapper=sheet?.querySelector('.statblock-wrapper');
   const style=(el,keys)=>{if(!el)return null;const css=getComputedStyle(el);return Object.fromEntries(keys.map(key=>[key,css[key]]))};
   const layer=el=>({id:el.className, text:el.textContent.trim(), style:style(el,['zIndex','opacity','mixBlendMode','transform','backgroundImage','width','height']),gradient:style(el.querySelector('.a4-layer-gradient-overlay'),['backgroundImage','opacity','mixBlendMode'])});
   return {sheet:sheet&&{width:sheet.offsetWidth,height:sheet.offsetHeight,style:style(sheet,['padding','border','backgroundColor','backgroundImage','aspectRatio','isolation'])},block:style(block,['width','height','fontSize','lineHeight','color','backgroundColor','backgroundImage']),wrapper:style(wrapper,['zIndex','transform','opacity','mixBlendMode']),layers:sheet?[...sheet.querySelectorAll('.a4-comp-layer')].map(layer):[],stageTransform:style(stage,['transform'])?.transform,editorHidden:getComputedStyle(document.querySelector('#editor')).display==='none',toolbarHidden:getComputedStyle(document.querySelector('.a4-preview-toolbar')).display==='none',exact:getComputedStyle(block).printColorAdjust,page:getComputedStyle(document.body).page};
  };
  return true;
 })()`)
 assert.equal(setup,true)
 const result=[]
 for(const orientation of ['portrait','landscape']) {
  await send('Emulation.setEmulatedMedia',{media:'screen'})
  await evaluate(`(()=>{const e=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('editor');e.a4Orientation='${orientation}';e.a4CompactDensity=${orientation==='landscape'};return true})()`)
  await delay(350)
  const screen=await evaluate('window.__printParitySnapshot()')
  assert.ok(screen.sheet&&screen.stageTransform!=='none',`${orientation}: scaled sheet witness`)
  await send('Emulation.setEmulatedMedia',{media:'print'})
  await delay(250)
  const print=await evaluate('window.__printParitySnapshot()')
  assert.deepEqual(print.sheet,screen.sheet,`${orientation}: paper geometry, padding, border and parchment`)
  for(const key of ['width','height']) assert.ok(Math.abs(parseFloat(print.block[key])-parseFloat(screen.block[key]))<=0.05,orientation+': subpixel '+key)
  const {width:pw,height:ph,...printTypography}=print.block,{width:sw,height:sh,...screenTypography}=screen.block
  assert.deepEqual(printTypography,screenTypography,`${orientation}: statblock typography and geometry`)
  assert.deepEqual(print.wrapper,screen.wrapper,`${orientation}: statblock composition layer`)
  assert.equal(print.layers.length,screen.layers.length)
  const layerProperties = (layer) => { const style={...layer.style}; delete style.width; delete style.height; return {...layer,style} }
  for(const [i,layer] of print.layers.entries()) for(const key of ['width','height']) assert.ok(Math.abs(parseFloat(layer.style[key])-parseFloat(screen.layers[i].style[key]))<=0.05,orientation+': layer subpixel '+key)
  assert.deepEqual(print.layers.map(layerProperties),screen.layers.map(layerProperties),`${orientation}: image, opacity, gradient, overlay text and stacking parity`)
  assert.ok(print.layers.length===2&&print.layers[0].text==='Layer witness',`${orientation}: composited fixture required`)
  assert.equal(print.stageTransform,'none',`${orientation}: screen zoom is not applied to paper`)
  assert.ok(print.editorHidden&&print.toolbarHidden,`${orientation}: editor chrome hidden`)
  assert.equal(print.exact,'exact',`${orientation}: printed statblock colors`)
  assert.equal(print.page,`dndsheet-${orientation}`,`${orientation}: named physical paper`)
  const {result:pdf}=await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false})
  const binary=Buffer.from(pdf.data,'base64').toString('latin1')
  assert.equal((binary.match(/\/Type\s*\/Page\b/g)||[]).length,1,`${orientation}: fitting sheet prints as one page`)
  const box=binary.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/)
  assert.ok(box,`${orientation}: inspect actual PDF media box`)
  const expected=orientation==='portrait'?PAPER_POINTS:[...PAPER_POINTS].reverse()
  assert.ok(expected.every((value,i)=>Math.abs(value-Number(box[i+1]))<2),`${orientation}: physical A4 media box ${box.slice(1).join(' x ')}`)
  result.push({orientation,mediaBox:box.slice(1).map(Number),geometry:[print.sheet.width,print.sheet.height],layers:print.layers.length,onePage:true})
 }
 const loaded=JSON.parse(fs.readFileSync(new URL('./fixtures/monsters/seraph.json',import.meta.url),'utf8'))
 loaded.portrait={url:witnessImage,position:'right',width:280}
 loaded.traits.push(...Array.from({length:14},(_,i)=>({...loaded.traits[0],id:'print-overflow-'+i,name:'Overflow '+i,description:'Example prose adds height to the statblock. The sheet preserves each rule clause and stays readable. '.repeat(3)})))
 await evaluate(`(()=>{const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,m=p._s.get('monster'),e=p._s.get('editor');m.$patch(${JSON.stringify(loaded)});e.a4Orientation='landscape';e.a4CompactDensity=false;e.a4Zoom='fit';e.a4Layout='side_by_side';e.statBlockColumns=2;e.a4StatblockScaleX=100;return true})()`)
 await delay(300)
 const native={preferCSSPageSize:false,paperWidth:210/25.4,paperHeight:297/25.4,landscape:true,printBackground:true,displayHeaderFooter:false,marginTop:0,marginRight:0,marginBottom:0,marginLeft:0}
 const pages=async(label)=>{
  const {result:pdf}=await send('Page.printToPDF',native)
  const bytes=Buffer.from(pdf.data,'base64')
  const evidenceDir=process.env.DNDSHEET_PRINT_PARITY_EVIDENCE
  if(evidenceDir){fs.mkdirSync(evidenceDir,{recursive:true});fs.writeFileSync(path.join(evidenceDir,label+'.pdf'),bytes)}
  const text=bytes.toString('latin1')
  const boxes=[...text.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map(m=>m.slice(1).map(Number))
  assert.ok(boxes.length>=2&&boxes.every(box=>Math.abs(box[0]-PAPER_POINTS[1])<2&&Math.abs(box[1]-PAPER_POINTS[0])<2),'Loaded native print preserves landscape A4 on every page')
  return boxes.length
 }
 const nominal=await pages('loaded-landscape-native')
 await evaluate(`(()=>{const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;p._s.get('editor').a4StatblockScaleX=155;return true})()`)
 await delay(250)
 const overflow=await evaluate(`(()=>{const el=document.querySelector('.a4-page-sheet'),css=getComputedStyle(el);return {portrait:!!el.querySelector('.monster-portrait'),x:css.overflowX,y:css.overflowY,scrollWidth:el.scrollWidth,width:el.offsetWidth,scrollHeight:el.scrollHeight,height:el.offsetHeight}})()`)
 assert.ok(overflow.portrait&&overflow.scrollWidth>overflow.width&&overflow.scrollHeight>overflow.height,'Loaded fixture exercises artwork and overflow on both axes')
 assert.deepEqual([overflow.x,overflow.y],['clip','visible'],'Horizontal bleed is trimmed at the paper edge without clipping vertical continuation')
 assert.equal(await pages('loaded-landscape-native-overflow'),nominal,'Horizontal bleed must not shrink the composed sheet and alter vertical pagination')
 await send('Emulation.setEmulatedMedia',{media:'screen'})
 await evaluate(`(()=>{document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia._s.get('editor').a4PreviewMode=false;return true})()`)
 await delay(150)
 const plain=await evaluate('window.__printParitySnapshot()')
 await send('Emulation.setEmulatedMedia',{media:'print'})
 const plainPrint=await evaluate('window.__printParitySnapshot()')
 assert.equal(plainPrint.sheet,null,'Plain preview does not acquire A4 composition')
 assert.equal(plainPrint.page,'auto','Plain print keeps the default page margins')
 assert.equal(plainPrint.block.fontSize,plain.block.fontSize,'Plain print retains statblock font size')
 assert.equal(plainPrint.block.color,plain.block.color,'Plain print retains statblock color')
 assert.equal(plainPrint.exact,'exact','Plain print requests exact colors')
 console.log('A4 print parity:',JSON.stringify({cases:result,loadedLandscape:{pages:nominal,...overflow},plain:true}))
},{port:Number(process.env.DNDSHEET_PRINT_PARITY_CDP_PORT||9364)})
