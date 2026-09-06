// Local-only prototype. No file bytes are uploaded or persisted.
(() => {
 const key='hs-material-iterations-v1',copy=x=>JSON.parse(JSON.stringify(x)),uid=()=>crypto.randomUUID();
 const read=()=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
 const store=r=>{const rows=read().filter(x=>x.id!==r.id);rows.push(copy(r));localStorage.setItem(key,JSON.stringify(rows))};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let app=null;
 const priorClose=closeDrawer;
 closeDrawer=function(){if(app){app.unmount();app=null}priorClose();$('#drawer').classList.remove('tw-dialog')};
 const css=document.createElement('style');css.textContent=`
 .tw-dialog{width:min(1000px,calc(100vw - 32px))}.tw-dialog .drawer-foot{display:none}
 .tw{--el-color-primary:#1677ff}.tw-note{padding:12px 16px;background:#f5f7fb;border-radius:6px;color:#4e5969;line-height:1.7;margin-bottom:18px;font-size:13px}
 .tw h3{margin:0 0 12px;font-size:16px}.tw-card{border:1px solid #e5e6eb;padding:18px;border-radius:8px;margin:14px 0}.tw-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.tw label{display:block;font-size:13px;color:#4e5969;margin-bottom:6px}.tw .el-select{width:100%}.tw-wide{grid-column:1/-1}
 .tw-row{display:flex;gap:12px;align-items:center;justify-content:space-between}.tw-file{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 0;border-bottom:1px solid #eee;font-size:13px}
 .tw-file b{overflow-wrap:anywhere;flex:1;min-width:100px}.tw-small{font-size:12px;color:#86909c}.tw-empty{padding:22px;background:#f7f8fa;color:#86909c;text-align:center}
 .tw input[type=file]{max-width:100%;font-size:13px}.tw-details{white-space:pre-wrap;line-height:1.7;font-size:13px;padding:10px;background:#fafbfc;max-height:260px;overflow:auto}
 .tw-drop{position:relative;display:flex!important;align-items:center;justify-content:center;gap:8px;min-height:104px;border:1px dashed #1677ff;border-radius:6px;background:#fafcff;cursor:pointer;margin:10px 0!important;font-size:14px!important}
 .tw-drop:hover,.tw-drop:focus-within{background:#edf5ff}.tw-drop input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}.tw-drop strong{color:#1677ff}
 .tw-sticky{position:sticky;bottom:-20px;background:white;border-top:1px solid #e5e6eb;padding:14px 0;margin-bottom:-20px;display:flex;justify-content:flex-end;gap:10px;z-index:5}
 .tw-shelf{margin:16px 0;padding:18px;background:white;border-radius:8px}.tw-shelf article{display:flex;align-items:center;justify-content:space-between;gap:16px;border-top:1px solid #eee;padding:12px 0}.tw-shelf h3{margin:0 0 12px}.tw-shelf small{display:block;color:#86909c}
 @media(max-width:650px){.tw-grid{grid-template-columns:1fr}.tw-shelf article{align-items:flex-start}}
 `;document.head.append(css);
 function open(id){
  const existing=read().find(r=>r.id===id);if(!existing)return;
  closeDrawer();openDrawer(existing.name,'<div id="topicWorkflow"></div>','');$('#drawer').classList.add('tw-dialog');
  app=Vue.createApp({
   setup(){
    const record=Vue.reactive(copy(existing));record.groups||=[];record.assignments||=[];record.deliveries||=[];
    record.groups.forEach(g=>{g.audioCodes=Array.isArray(g.audioCodes)?g.audioCodes:g.audioCode?[g.audioCode]:[];g.audioCodesText=g.audioCodesText??g.audioCodes.join('、')});
    const page=Vue.ref('materials'),error=Vue.ref(''),message=Vue.ref('');
    const form=record.form,locked=Vue.computed(()=>record.status==='published');
    const directions=[...new Set([...topics.flatMap(t=>t.directions),...(form.directions||[])])];
    const persist=()=>{try{record.groups.forEach(g=>{g.audioCodes=TopicFlowRules.parseAudioCodes(g.audioCodesText)});store(record);window.TopicWorkflow.refresh();return true}catch{error.value='本地存储失败，请保留当前窗口。';return false}};
    const changed=()=>{error.value='';message.value=''};
    const blocks=k=>(form[k]||[]).filter(b=>b.text?.trim()).map((b,i)=>({value:b.id,label:(k==='titles'?'标题':k==='openings'?'开头':'正文')+(i+1)+' · '+b.text.slice(0,24)}));
    const text=(k,id)=>(form[k]||[]).find(b=>b.id===id)?.text||'未指定';
    const groupsOptions=Vue.computed(()=>record.groups.map(g=>({value:g.id,label:g.name||'未命名素材组'})));
    const addGroup=()=>{record.groups.push({id:uid(),name:'',device:'',date:'',scene:'',clothing:'',prop:'',position:'',action:'',shot:'',audioMode:'',audioCodes:[],audioCodesText:'',note:'',titleIds:[],openingIds:[],bodyIds:[],files:[]});changed()};
    const chooseFiles=(event,g,kind)=>{
     const files=[...(event.dataTransfer?.files||event.target.files)];const invalid=files.some(f=>kind==='video'?!(/\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(f.name)) : !(/\.(mp3|wav|m4a|aac|flac|ogg|mp4|mov)$/i.test(f.name)));
     if(invalid){error.value='文件类型不符合要求，请选择视频或音频文件。';event.target.value='';return}
     files.forEach(f=>g.files.push({id:uid(),name:f.name,size:f.size,kind,status:'pending'}));event.target.value='';changed();
    };
    const complete=(f,status)=>{f.status=status;changed()};
    const publish=()=>{error.value=TopicFlowRules.publishError(record,[...read(),...topics.map(t=>({...t,status:'published'}))],{demoSkipUploads:true});if(error.value)return;record.name=form.name.trim();record.status='published';record.demoSkippedUploads=true;if(!persist()){record.status='draft';record.demoSkippedUploads=false;return}message.value='已进入剪辑分配。本次为原型演示，未执行真实上传。';page.value='assign';Vue.nextTick(()=>{$('#drawerBody').scrollTop=0})};
    const task=Vue.reactive({editor:'',direction:'',groupIds:[],mode:'free',titleId:'',openingId:'',bodyId:'',note:''});
    const editors=Vue.ref([]),priorities=Vue.reactive({}),editingId=Vue.ref('');
    const editorOptions=[...new Set(['陈思远','绚丽','琦琪','嘎嘎','梦琦',...record.assignments.map(a=>a.editor)])];
    record.assignments.forEach(a=>{a.priority||='普通'});
    const resetTask=()=>{editingId.value='';editors.value=[];Object.assign(task,{editor:'',direction:'',groupIds:[],mode:'free',titleId:'',openingId:'',bodyId:'',note:''});Object.keys(priorities).forEach(k=>delete priorities[k])};
    const editTask=a=>{editingId.value=a.id;editors.value=[a.editor];priorities[a.editor]=a.priority;Object.assign(task,copy(a));Vue.nextTick(()=>{task.titleId=a.titleId;task.openingId=a.openingId;task.bodyId=a.bodyId;$('#drawerBody').scrollTop=0})};
    const changePriority=(a,value)=>{const previous=a.priority;a.priority=value;if(!persist())a.priority=previous};
    const taskOutputs=a=>record.deliveries.filter(d=>d.assignmentId===a.id).length;
    const finishTask=a=>{if(!taskOutputs(a)){error.value='至少关联一条成片后再标记完成。';return}const previous=a.status;a.status=a.status==='已完成'?'剪辑中':'已完成';if(!persist())a.status=previous};
    Vue.watch(()=>task.mode,()=>{task.titleId='';task.openingId='';task.bodyId=''});
    const selectedBodies=Vue.computed(()=>blocks('bodies').filter(b=>record.groups.some(g=>task.groupIds.includes(g.id)&&g.bodyIds.includes(b.value))));
    const assign=()=>{
     if(!editors.value.length){error.value='请勾选剪辑师。';return}
     const batch=editors.value.map(editor=>({...copy(task),editor,priority:priorities[editor]||'普通'}));
     for(const a of batch){error.value=TopicFlowRules.assignmentError(record,a);if(error.value)return}
     const previous=copy(record.assignments);
     if(editingId.value){const index=record.assignments.findIndex(a=>a.id===editingId.value);if(index<0)return;record.assignments[index]={...record.assignments[index],...batch[0],id:editingId.value}}
     else record.assignments.push(...batch.map(a=>({...a,id:uid(),status:'待剪辑',createdAt:new Date().toISOString()})));
     if(persist()){message.value=editingId.value?'任务修改已保存。':'已为 '+batch.length+' 位剪辑师分别创建任务，可单独调整优先级。';resetTask()}else record.assignments=previous;
    };
    const delivery=Vue.reactive({assignmentId:'',groupIds:[],fileIds:[],titleId:'',openingId:'',bodyId:'',file:null,note:''});
    const selectedTask=Vue.computed(()=>record.assignments.find(a=>a.id===delivery.assignmentId));
    const deliveryGroups=Vue.computed(()=>record.groups.filter(g=>selectedTask.value?.groupIds.includes(g.id)).map(g=>({value:g.id,label:g.name})));
    const deliveryFiles=Vue.computed(()=>record.groups.filter(g=>delivery.groupIds.includes(g.id)).flatMap(g=>g.files.filter(f=>f.status==='ready').map(f=>({value:f.id,label:g.name+' / '+f.name}))));
    const deliveryBodies=Vue.computed(()=>blocks('bodies').filter(b=>record.groups.some(g=>delivery.groupIds.includes(g.id)&&g.bodyIds.includes(b.value))));
    const selectTask=()=>{Object.assign(delivery,{groupIds:[],fileIds:[],titleId:selectedTask.value?.titleId||'',openingId:selectedTask.value?.openingId||'',bodyId:selectedTask.value?.bodyId||'',file:null})};
    const chooseFinal=e=>{const f=e.target.files[0];if(!f)return;if(!/\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(f.name)){error.value='请选择视频成片。';return}delivery.file={id:uid(),name:f.name,size:f.size,status:'pending'};e.target.value=''};
    const deliver=()=>{error.value=TopicFlowRules.deliveryError(record,selectedTask.value,delivery);if(error.value)return;const previous=selectedTask.value.status;record.deliveries.push({...copy(delivery),id:uid(),direction:selectedTask.value.direction,editor:selectedTask.value.editor});selectedTask.value.status='剪辑中';if(persist()){message.value='成片已关联，可继续回传多个成片；本次任务结束后再标记完成。';delivery.file=null}else{record.deliveries.pop();selectedTask.value.status=previous}};
    const edit=()=>{if(!persist())return;const r=copy(record);closeDrawer();openTopicForm(!!r.sourceTopicId,r.sourceTopicId?{id:r.sourceTopicId,name:topics.find(t=>t.id===r.sourceTopicId)?.name||'来源选题'}:null,r)};
    const save=()=>{if(persist())message.value='已保存到草稿箱。'};
    return {record,form,page,error,message,locked,directions,blocks,text,groupsOptions,addGroup,chooseFiles,complete,publish,task,editors,priorities,editorOptions,editingId,resetTask,editTask,changePriority,taskOutputs,finishTask,selectedBodies,assign,delivery,selectedTask,deliveryGroups,deliveryFiles,deliveryBodies,selectTask,chooseFinal,deliver,edit,save,close:()=>closeDrawer(),groupNames:ids=>record.groups.filter(g=>ids.includes(g.id)).map(g=>g.name).join('、')};
   },
   template:`
    <div class="tw">
     <div class="tw-note"><b>{{locked?'已入库（演示）':'草稿 · 待素材准备'}}</b> ｜ {{form.director||'编导待填'}}<br>原型演示无需上传文件。填写必要信息后，点击“确认入库”直接进入剪辑分配；不代表真实文件已上传。</div>
     <el-tabs v-model="page"><el-tab-pane label="脚本／拍摄素材" name="materials"/><el-tab-pane label="剪辑分配" name="assign" :disabled="!locked"/><el-tab-pane label="成片" name="finals" :disabled="!locked"/></el-tabs>
     <div v-show="page==='materials'">
      <div class="tw-row"><h3>本次脚本内容</h3><el-button v-if="!locked" link type="primary" @click="edit">编辑草稿内容</el-button></div>
      <details class="tw-card" v-for="k in ['titles','openings','bodies']" :key="k"><summary>{{k==='titles'?'标题':k==='openings'?'开头':'正文'}} · {{blocks(k).length}}</summary><div class="tw-details" v-for="b in form[k]" :key="b.id">{{b.text}}<p v-if="b.note">说明：{{b.note}}</p></div></details>
      <div class="tw-row"><h3>脚本／拍摄素材组</h3><el-button v-if="!locked" type="primary" plain @click="addGroup">＋ 添加素材组</el-button></div>
      <p class="tw-small">同一份正文可用于多次拍摄。每组明确内容、设备、场景和音频，上传后再确认对应文件。</p>
      <div class="tw-empty" v-if="!record.groups.length">尚无素材组。未准备好原片时，只能保存草稿。</div>
      <article class="tw-card" v-for="(g,index) in record.groups" :key="g.id">
       <div class="tw-row"><h3>素材组 {{index+1}}</h3><el-button v-if="!locked" link type="danger" @click="record.groups.splice(index,1)">删除空闲素材组</el-button></div>
       <fieldset :disabled="locked" style="border:0;padding:0;margin:0">
       <div class="tw-grid">
        <div class="tw-wide"><label>素材组名称 *</label><el-input v-model="g.name" :disabled="locked" placeholder="例如：会议室 · 手机 · 绿色polo衫"/></div>
        <div><label>关联标题</label><multi-field v-if="!locked" v-model="g.titleIds" :options="blocks('titles')"/><p v-else>{{g.titleIds.map(id=>text('titles',id)).join(' / ')||'未限定'}}</p></div>
        <div><label>关联开头</label><multi-field v-if="!locked" v-model="g.openingIds" :options="blocks('openings')"/><p v-else>{{g.openingIds.map(id=>text('openings',id)).join(' / ')||'未限定'}}</p></div>
        <div class="tw-wide"><label>关联正文 *</label><multi-field v-if="!locked" v-model="g.bodyIds" :options="blocks('bodies')"/><p v-else>{{g.bodyIds.map(id=>text('bodies',id).slice(0,40)).join(' / ')}}</p></div>
        <div><label>设备</label><el-select v-model="g.device" :disabled="locked"><el-option v-for="v in ['手机','相机']" :key="v" :label="v" :value="v"/></el-select></div>
        <div><label>拍摄日期</label><el-input v-model="g.date" type="date" :disabled="locked"/></div>
        <div v-for="(label,k) in {scene:'场景',clothing:'服装',prop:'道具',position:'机位',action:'动作／姿态',shot:'画面镜号'}" :key="k"><label>{{label}}</label><el-input v-model="g[k]" :disabled="locked"/></div>
        <div><label>音频使用方式 *</label><el-select v-model="g.audioMode" :disabled="locked"><el-option label="使用画面声音" value="original"/><el-option label="使用其他音频" value="specified"/></el-select></div>
        <div><label>音频镜号（选填，可多个）</label><el-input v-model="g.audioCodesText" :disabled="locked" placeholder="例如：c0269、c0270"/><p class="tw-small">直接填写，多个镜号用逗号或顿号分隔；后续由后台关联，本原型仅保存输入。</p></div>
        <div class="tw-wide"><label>剪辑说明／取用范围</label><el-input type="textarea" v-model="g.note" :disabled="locked"/></div>
       </div></fieldset>
       <div v-if="!locked" style="margin-top:16px"><label>上传原片</label><label class="tw-drop" @dragover.prevent @drop.prevent="chooseFiles($event,g,'video')"><span>拖拽原片到这里，或</span><strong>选择文件</strong><input aria-label="选择原片文件" type="file" accept="video/*" multiple @change="chooseFiles($event,g,'video')"/></label><p class="tw-small">暂无原片可先保存草稿，拍摄后继续上传。支持多文件，本原型不会实际传输文件。</p><template v-if="g.audioMode==='specified'"><label>上传其他音频（也可从视频取声）</label><label class="tw-drop" @dragover.prevent @drop.prevent="chooseFiles($event,g,'audio')"><span>拖拽音频或视频到这里，或</span><strong>选择文件</strong><input aria-label="选择其他音频文件" type="file" accept="audio/*,video/*" multiple @change="chooseFiles($event,g,'audio')"/></label></template></div>
       <p v-if="g.audioMode==='original'" class="tw-small">当前使用画面声音，对应画面镜号。已填写的音频镜号和其他音频保留，暂不使用，也不阻挡入库。</p>
       <div class="tw-file" v-for="(f,i) in g.files" :key="f.id"><span>{{f.kind==='video'?'原片':'音频'}}</span><b>{{f.name}}</b><el-tag :type="f.status==='ready'?'success':f.status==='failed'?'danger':'warning'">{{f.status==='ready'?'模拟完成':f.status==='failed'?'失败':'已选文件 · 待完成'}}</el-tag>
        <template v-if="!locked"><el-button link type="primary" @click="complete(f,'ready')">模拟完成</el-button><el-button link @click="complete(f,'failed')">模拟失败</el-button><el-button link type="danger" @click="g.files.splice(i,1)">移除</el-button></template>
       </div>
      </article>
     </div>
     <div v-show="page==='assign'">
      <h3>{{editingId?'修改剪辑任务':'批量分配剪辑'}}</h3><p class="tw-small">勾选人员后分别生成任务。优先级只影响该剪辑师的任务顺序，不改变其他人的排期；一条任务可回传多个成片。</p>
      <div class="tw-grid">
       <div><label>剪辑师 *</label><multi-field v-if="!editingId" v-model="editors" :options="editorOptions"/><el-input v-else :model-value="task.editor" disabled/></div>
       <div><label>成片方向 *</label><el-select v-model="task.direction"><el-option v-for="n in directions" :key="n" :label="n" :value="n"/></el-select></div>
       <div class="tw-wide" v-if="editors.length"><label>分别设置优先级</label><div class="tw-file" v-for="n in editors" :key="n"><b>{{n}}</b><el-radio-group :model-value="priorities[n]||'普通'" @update:model-value="priorities[n]=$event"><el-radio-button value="普通">普通</el-radio-button><el-radio-button value="优先">优先剪辑</el-radio-button></el-radio-group></div></div>
       <div class="tw-wide"><label>允许使用的素材组 *</label><multi-field v-model="task.groupIds" :options="groupsOptions"/></div>
       <div class="tw-wide"><label>组合要求 *</label><el-radio-group v-model="task.mode"><el-radio value="specified">指定内容组合</el-radio><el-radio value="free">允许在所选素材组内自行组合</el-radio></el-radio-group></div>
       <template v-if="task.mode==='specified'"><div><label>标题（可不指定）</label><el-select v-model="task.titleId" clearable><el-option v-for="b in blocks('titles')" :key="b.value" :label="b.label" :value="b.value"/></el-select></div><div><label>开头（可不指定）</label><el-select v-model="task.openingId" clearable><el-option v-for="b in blocks('openings')" :key="b.value" :label="b.label" :value="b.value"/></el-select></div><div class="tw-wide"><label>正文 *</label><el-select v-model="task.bodyId"><el-option v-for="b in selectedBodies" :key="b.value" :label="b.label" :value="b.value"/></el-select></div></template>
       <div class="tw-wide"><label>补充要求</label><el-input type="textarea" v-model="task.note"/></div>
      </div><el-button type="primary" style="margin:16px 0" @click="assign">{{editingId?'保存修改':'确认分配'+(editors.length?'（'+editors.length+'人）':'')}}</el-button><el-button v-if="editingId" @click="resetTask">取消修改</el-button>
      <h3>已分配任务 · {{record.assignments.length}}</h3>
      <el-table :data="record.assignments" style="width:100%" empty-text="尚未分配，勾选剪辑师后确认分配">
       <el-table-column prop="editor" label="剪辑师" width="100"/>
       <el-table-column label="素材／方向" min-width="200"><template #default="{row:a}"><b>{{groupNames(a.groupIds)}}</b><div class="tw-small">{{a.direction}}</div></template></el-table-column>
       <el-table-column label="优先级" width="115"><template #default="{row:a}"><el-select :model-value="a.priority" @update:model-value="changePriority(a,$event)" aria-label="任务优先级"><el-option label="普通" value="普通"/><el-option label="优先剪辑" value="优先"/></el-select></template></el-table-column>
       <el-table-column prop="status" label="状态" width="90"/>
       <el-table-column label="成片" width="65"><template #default="{row:a}">{{taskOutputs(a)}}</template></el-table-column>
       <el-table-column label="操作" width="160"><template #default="{row:a}"><el-button link type="primary" :disabled="taskOutputs(a)>0" @click="editTask(a)">修改要求</el-button><el-button link @click="finishTask(a)">{{a.status==='已完成'?'继续剪辑':'标记完成'}}</el-button></template></el-table-column>
       <el-table-column type="expand"><template #default="{row:a}"><div style="padding:12px 20px"><p>{{a.mode==='free'?'允许在所选素材组内自行组合':'指定内容组合'}}</p><p v-if="a.mode==='specified'">标题：{{text('titles',a.titleId)}}<br>开头：{{text('openings',a.openingId)}}<br>正文：{{text('bodies',a.bodyId)}}</p><p>{{a.note||'无补充要求'}}</p><p class="tw-small" v-if="taskOutputs(a)">已有成片，保留原任务要求；如需不同要求，请新建分配。优先级仍可修改。</p></div></template></el-table-column>
      </el-table>
     </div>
     <div v-show="page==='finals'">
      <h3>成片回传</h3><div class="tw-empty" v-if="!record.assignments.length">先完成剪辑分配，再将成片关联回对应分配。</div>
      <div v-else class="tw-grid">
       <div class="tw-wide"><label>对应剪辑分配 *</label><el-select v-model="delivery.assignmentId" @change="selectTask"><el-option v-for="a in record.assignments" :key="a.id" :label="a.editor+' · '+a.direction" :value="a.id"/></el-select></div>
       <div class="tw-wide"><label>实际使用的素材组 *</label><multi-field v-model="delivery.groupIds" :options="deliveryGroups"/></div>
       <div class="tw-wide"><label>实际使用的原片／音频 *</label><multi-field v-model="delivery.fileIds" :options="deliveryFiles"/></div>
       <div><label>实际标题</label><el-select v-model="delivery.titleId" clearable><el-option v-for="b in blocks('titles')" :key="b.value" :label="b.label" :value="b.value"/></el-select></div>
       <div><label>实际开头</label><el-select v-model="delivery.openingId" clearable><el-option v-for="b in blocks('openings')" :key="b.value" :label="b.label" :value="b.value"/></el-select></div>
       <div class="tw-wide"><label>实际正文 *</label><el-select v-model="delivery.bodyId"><el-option v-for="b in deliveryBodies" :key="b.value" :label="b.label" :value="b.value"/></el-select></div>
       <div class="tw-wide"><label>选择成片文件 *</label><input type="file" accept="video/*" @change="chooseFinal"/><div v-if="delivery.file" class="tw-file"><b>{{delivery.file.name}}</b><el-tag>{{delivery.file.status==='ready'?'模拟完成':'待完成'}}</el-tag><el-button link @click="delivery.file.status='ready'">模拟完成</el-button></div></div>
       <div class="tw-wide"><el-button type="primary" @click="deliver">确认回传到本选题</el-button></div>
      </div>
      <article class="tw-card" v-for="d in record.deliveries" :key="d.id"><h3>{{d.file.name}}</h3><p>{{d.editor}} · {{d.direction}}</p><p>素材组：{{groupNames(d.groupIds)}}</p><p class="tw-small">本地演示记录，未保存视频文件本体。</p></article>
     </div>
     <p role="alert" style="color:#d4380d" v-if="error">{{error}}</p><p role="status" v-if="message">{{message}}</p>
     <div class="tw-sticky"><el-button @click="close">关闭</el-button><template v-if="!locked"><el-button @click="save">保存草稿</el-button><el-button type="primary" @click="publish">确认入库</el-button></template></div>
    </div>`
  });
  app.component('MultiField',MaterialMulti);app.use(ElementPlus,{locale:ElementPlusLocaleZhCn});app.mount('#topicWorkflow');
 }
 function shelf(draft){
  document.querySelector('.tw-shelf')?.remove();
  let rows=read().filter(r=>r.form&&(draft?r.status==='draft':r.status==='published'&&r.groups?.length));
  if(!draft)rows=rows.filter(r=>(!state.query||r.name.includes(state.query))&&['usage','line','product','ip','platform','director','direction'].every(k=>{
   const v=state[k];if(!v?.length)return true;const values=Array.isArray(v)?v:[v],value=r.form[{platform:'platforms',direction:'directions'}[k]||k];return values.some(x=>Array.isArray(value)?value.includes(x):value===x);
  }));
  const box=document.createElement('section');box.className='tw-shelf';box.innerHTML='<h3>'+ (draft?'本机草稿':'本机新建选题 · 流程演示')+'</h3><p class="tw-small">'+(draft?'未入库，不参与正式素材统计。':'这些记录来自本地流程，不与原始演示数据混算。')+'</p>';
  if(!rows.length)box.insertAdjacentHTML('beforeend','<p class="tw-small">暂无记录</p>');
  rows.forEach(r=>{const a=document.createElement('article');a.innerHTML='<div><b>'+esc(r.name||'未命名草稿')+'</b><small>'+esc(r.form.director||'编导待填')+' · '+(r.groups?.length||0)+'组素材 · '+(r.assignments?.length||0)+'条分配 · '+(r.deliveries?.length||0)+'条成片</small></div>';const b=document.createElement('button');b.className='btn primary';b.textContent=draft?'继续准备':'查看／剪辑／成片';b.onclick=()=>open(r.id);a.append(b);box.append(a)});
  const view=$('#view');(view.querySelector('.cards')||view.querySelector('.panel'))?.before(box);if(!box.isConnected)view.append(box);
 }
 const oldDrafts=renderDrafts;renderDrafts=function(){oldDrafts();shelf(true)};
 const oldLibrary=renderLibrary;renderLibrary=function(){oldLibrary();shelf(false)};
 window.TopicWorkflow={open,refresh(){if(!state.topic){if(state.view==='drafts')shelf(true);else if(state.view==='library')shelf(false)}}};
 if(state.view==='library'&&!state.topic)renderLibrary();
})();
