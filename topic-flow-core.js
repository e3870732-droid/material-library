// Pure prototype transition guards. File states are explicitly simulated.
(function(root){
 const ready=f=>f.status==='ready';
 function iterationName(source,rows=[],originals=[]){
  let root=source,seen=new Set();
  while(root?.sourceTopicId&&!seen.has(root.id)){seen.add(root.id);const parent=[...rows,...originals].find(x=>x.id===root.sourceTopicId);if(!parent)break;root=parent}
  const rootId=source.rootTopicId||root.id,base=source.rootTopicName||root.name;
  let max=0;
  for(const r of rows.filter(x=>x.status==='published')){
   const suffix=(r.name||'').startsWith(base+'V')?r.name.slice((base+'V').length):'';
   if(/^\d+$/.test(suffix))max=Math.max(max,Number(suffix));
  }
  return {name:base+'V'+(max+1),rootTopicId:rootId,rootTopicName:base,iterationNumber:max+1};
 }
 function parseAudioCodes(value){return [...new Set(String(value||'').split(/[,，、;；\n]+/).map(s=>s.trim()).filter(Boolean))]}
 function publishError(r,records=[],options={}){
  const f=r.form;
  if(!f.name?.trim()||!f.director?.trim()||!f.usage)return '请先补齐名称、编导和用途。';
  if(records.some(x=>x.id!==r.id&&x.status==='published'&&(x.name||x.form?.name||'').trim()===f.name.trim()))return '选题名称已存在，请修改后再发布。';
  if(!f.bodies?.some(x=>x.text.trim()))return '至少填写一段正文。';
  if(!r.groups?.length)return '请添加脚本／拍摄素材组。';
  for(const g of r.groups){
   for(const [ids,key] of [['titleIds','titles'],['openingIds','openings']]){
    if((g[ids]||[]).some(id=>!(f[key]||[]).some(b=>b.id===id&&b.text.trim())))return '素材组关联的标题或开头已被删除，请重新选择。';
   }
   if(!g.name?.trim()||!g.bodyIds?.length||g.bodyIds.some(id=>!f.bodies.some(b=>b.id===id&&b.text.trim())))return '每组需填写名称并关联有效正文。';
   if(!options.demoSkipUploads&&!g.files?.some(x=>x.kind==='video'&&ready(x)))return '每组至少需要一份已完成的原片。选择文件或填写镜号不代表完成。';
   if(!options.demoSkipUploads&&g.files.some(x=>!ready(x)&&(x.kind==='video'||g.audioMode==='specified')))return '仍有待完成或失败的素材，请处理后再确认入库。';
   if(!g.audioMode)return '请明确每组使用画面原声还是指定音频。';
   if(!options.demoSkipUploads&&g.audioMode==='specified'&&!g.files.some(x=>x.kind==='audio'&&ready(x)))return '指定音频尚未准备好。';
  }
  return '';
 }
 function assignmentError(r,a){
  if(r.status!=='published')return '草稿不能分配剪辑，请先确认入库。';
  if(!a.editor||!a.direction||!a.groupIds?.length||!a.mode)return '请明确剪辑师、方向、素材组及组合要求。';
  if(a.groupIds.some(id=>!r.groups.some(g=>g.id===id)))return '素材组已失效，请重新选择。';
  if(a.mode==='specified'&&!a.bodyId)return '指定组合至少选择一段正文。';
  const allowed=new Set(r.groups.filter(g=>a.groupIds.includes(g.id)).flatMap(g=>g.bodyIds));
  if(a.bodyId&&!allowed.has(a.bodyId))return '正文不属于所选素材组。';
  for(const [field,key,ids] of [['titleId','titles','titleIds'],['openingId','openings','openingIds']]){
   if(a[field]&&(!(r.form[key]||[]).some(b=>b.id===a[field])||!r.groups.some(g=>a.groupIds.includes(g.id)&&(!g[ids]?.length||g[ids].includes(a[field])))))return '标题或开头不属于所选素材范围。';
  }
  return '';
 }
 function deliveryError(r,a,d){
  if(r.status!=='published')return '草稿尚未入库，不能回传成片。';
  if(!a)return '请先选择剪辑分配。';
  if(!d.file||d.file.status!=='ready')return '请先完成成片的模拟上传。';
  if(!d.groupIds?.length||d.groupIds.some(id=>!a.groupIds.includes(id)))return '请选择分配范围内的实际素材组。';
  const groups=r.groups.filter(g=>d.groupIds.includes(g.id));
  const allowed=new Set(groups.flatMap(g=>g.files.filter(ready).map(f=>f.id)));
  if(!d.fileIds?.length||d.fileIds.some(id=>!allowed.has(id)))return '请记录实际使用的原片／音频文件。';
  if(!groups.some(g=>g.files.some(f=>f.kind==='video'&&d.fileIds.includes(f.id))))return '请至少指定一份实际使用的原片。';
  if(groups.some(g=>g.audioMode==='specified'&&!g.files.some(f=>f.kind==='audio'&&d.fileIds.includes(f.id))))return '请记录素材组要求的指定音频。';
  if(!d.bodyId||!groups.some(g=>g.bodyIds.includes(d.bodyId)))return '请指定实际使用的正文。';
  for(const [field,key,ids] of [['titleId','titles','titleIds'],['openingId','openings','openingIds']]){
   if(d[field]&&(!(r.form[key]||[]).some(b=>b.id===d[field])||!groups.some(g=>!g[ids]?.length||g[ids].includes(d[field]))))return '实际标题或开头不属于所选素材范围。';
  }
  if(a.mode==='specified'&&['titleId','openingId','bodyId'].some(k=>(a[k]||'')!==(d[k]||'')))return '实际内容与指定组合不一致，请先与编导确认调整。';
  return '';
 }
 const api={publishError,assignmentError,deliveryError,iterationName,parseAudioCodes};
 if(typeof module!=='undefined')module.exports=api;else root.TopicFlowRules=api;
})(typeof window!=='undefined'?window:this);
