// Topic iterations copy only the name and retain topic-level provenance.
(() => {
 const storageKey='hs-material-iterations-v1';
 const read=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return []}};
 const clone=x=>JSON.parse(JSON.stringify(x));
 const block=(text='')=>({id:crypto.randomUUID(),text,note:''});
 const products={教育规划:['教育规划精华课（阿留）','教育规划精华课（深圳店播）','教育规划精华课（北京店播）','教育规划陪跑营'],大场:['豆神语文小王者','伴鱼阅读营','伴鱼科普营','火花思维','洋葱学园','一亩宝盒'],豆神双语:['豆神双语小王者'],飞轮学习力:['飞轮学习力体验课','飞轮学习力']};
 let app=null;
 const oldClose=closeDrawer;
 closeDrawer=function(){oldClose();if(app){app.unmount();app=null}$('#drawer').classList.remove('iteration-dialog')};
 const style=document.createElement('style');
 style.textContent=`
 .drawer.iteration-dialog{width:min(880px,calc(100vw - 32px))}
 .iteration-dialog .drawer-body{padding:24px 28px}
 .iteration-dialog .drawer-foot{display:none}
 .iteration-dialog .drawer-head{gap:16px}
 .iteration-dialog .drawer-head h2{margin-right:auto}
 .iteration-dialog .ie-save-draft{order:1;margin-left:auto}
 .iteration-dialog .drawer-head #close{order:2}
 .ie{--el-color-primary:#1677ff;color:#1d2129}
 .ie-section{padding:0 0 24px;margin-bottom:24px;border-bottom:1px solid #e5e6eb}
 .ie h3{font-size:16px;margin:0 0 14px}.ie p{color:#86909c;font-size:12px;line-height:1.6;margin:6px 0 14px}
 .ie-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 20px}.ie-field{min-width:0}.ie-field>label{display:block;color:#4e5969;font-size:14px;margin-bottom:8px}
 .ie .el-select{width:100%}.ie .el-select__wrapper,.ie .el-input__wrapper{min-height:38px;box-sizing:border-box}
 .ie-source{background:#f5f7fb;padding:14px 16px;border-radius:6px;margin-bottom:24px;line-height:1.8}
 .ie-wide{grid-column:1/-1}.ie-heading,.ie-block-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
 .ie-block{border:0;border-radius:0;padding:0;margin:14px 0 22px;background:transparent}
 .ie-block-head{margin-bottom:8px;font-size:13px;color:#4e5969}.ie-block details{margin-top:10px;color:#86909c;font-size:12px}.ie-block summary{cursor:pointer;margin-bottom:8px}
 .ie-actions{position:sticky;bottom:-24px;margin:0 -28px -24px;padding:14px 28px;background:#fff;border-top:1px solid #e5e6eb;display:flex;justify-content:flex-end;gap:10px;z-index:5}
 .ie-error{color:#d4380d!important}.ie-empty{padding:16px;background:#f7f8fa;color:#86909c;font-size:13px}
 .ie-icon{border:0;background:transparent;color:#86909c;cursor:pointer;width:30px;height:28px;border-radius:4px}.ie-icon:hover{background:#f2f3f5;color:#1677ff}.ie-icon svg{width:16px;height:16px;vertical-align:middle}
 @media(max-width:600px){.ie-grid{grid-template-columns:1fr}.iteration-dialog .drawer-body{padding:18px}.ie-actions{margin:0 -18px -18px;bottom:-18px;padding:12px 18px}}
 `;
 document.head.append(style);
 openTopicForm=function(iter=false,source=null,resume=null){
  if(app){app.unmount();app=null}
  const topic=source||null;
  const naming=iter&&topic?TopicFlowRules.iterationName(topic,read(),topics):{};
  openDrawer(iter?'创建选题迭代':'新建选题','<div id="iterationEditor"></div>','');
  $('#drawer').classList.add('iteration-dialog');
  app=Vue.createApp({
   setup(){
    const error=Vue.ref(''),saved=Vue.ref(''),undo=Vue.ref(null);
    let draftId=resume?.id||crypto.randomUUID();
    const blank=()=>({name:naming.name||'',director:'',usage:'',platforms:[],directions:[],line:'',product:'',category:[],ip:[],titles:[block()],openings:[block()],bodies:[block()],refs:[]});
    const form=Vue.reactive(resume?clone(resume.form):blank());
    for(const key of ['category','ip'])form[key]=Array.isArray(form[key])?form[key]:form[key]?[form[key]]:[];
    form.amateur??='';
    const ipOptions=()=>{
     const roster=form.line==='豆神双语'?['龚老师','金老师','林那','鹤然老师','Kate','李桐']:form.product.includes('深圳店播')?['阿留老师','许老师','皮皮老师','刘老师','王老师']:form.product.includes('北京店播')?['阿留老师','柯老师','明桐老师']:['阿留老师'];
     return [...new Set([...roster,...form.ip])];
    };
    for(const key of ['titles','openings','bodies'])if(!form[key]?.length)form[key]=[block()];
    const sections=[{key:'titles',label:'标题'},{key:'openings',label:'开头'},{key:'bodies',label:'正文'}];
    const remove=(key,index)=>{undo.value={key,index,item:clone(form[key][index])};form[key].splice(index,1)};
    const clear=(key,index)=>{undo.value={key,index,item:clone(form[key][index]),clear:true};form[key][index].text=''};
    const revert=()=>{const u=undo.value;if(!u)return;if(u.clear){const item=form[u.key].find(x=>x.id===u.item.id);if(item)Object.assign(item,u.item)}else form[u.key].splice(u.index,0,u.item);undo.value=null};
    const addRef=()=>form.refs.push({id:crypto.randomUUID(),device:'',shot:'',audio:'',note:''});
    const save=status=>{
     error.value='';
     if(!form.name.trim()){error.value='请先填写选题名称，以便在草稿箱找到。';return}
     const data=clone(form);
     const existing=read().find(r=>r.id===draftId);
     const records=read().filter(r=>r.id!==draftId),record={...naming,...existing,id:draftId,sourceTopicId:resume?.sourceTopicId||(iter?topic?.id||null:null),name:form.name.trim(),status:'draft',form:data,groups:existing?.groups||[],assignments:existing?.assignments||[],deliveries:existing?.deliveries||[],createdAt:existing?.createdAt||new Date().toISOString()};
     records.push(record);
     try{localStorage.setItem(storageKey,JSON.stringify(records))}catch{error.value='本地保存失败，请保留当前窗口并复制内容。';return}
     saved.value='已保存到草稿箱。原片准备好并确认后才能入库。';
     if(status==='continue'){const id=draftId;closeDrawer();window.TopicWorkflow.open(id)}
     else ElementPlus.ElMessage.success('已保存到草稿箱');
     window.TopicWorkflow?.refresh();
    };
    return {iter,topic,form,error,saved,undo,sections,products,ipOptions,remove,clear,revert,addRef,save,close:()=>closeDrawer(),add:key=>form[key].push(block()),changeLine:()=>{form.product='';form.ip=[]},changeProduct:()=>{form.ip=[]},platformOptions:['抖音','小红书','视频号'],directionOptions:[...new Set([...topics.flatMap(t=>t.directions),'分层对比型','课效销售型'])]};
   },
   template:`
   <div class="ie">
    <teleport to="#drawer .drawer-head"><el-button class="ie-save-draft" link type="primary" @click="save('draft')">保存草稿</el-button></teleport>
    <div class="ie-source" v-if="iter"><b>来源选题：{{topic.name}}</b><br><span>默认名称按已发布迭代递增；草稿不占名，发布时检查重名。其他信息请重新填写。</span>
    </div>
    <section class="ie-section"><h3>{{iter?'本次迭代':'选题信息'}}</h3><div class="ie-grid">
     <div class="ie-field ie-wide"><label>选题名称 *</label><el-input v-model="form.name" placeholder="请输入选题名称"/></div>
     <div class="ie-field"><label>编导 *</label><el-select v-model="form.director" filterable allow-create default-first-option placeholder="输入或选择编导"><el-option v-for="v in ['陶雨桐','于炅仟']" :key="v" :label="v" :value="v"/></el-select></div>
    </div></section>
    <section class="ie-section"><h3>使用与方向</h3><div class="ie-grid">
     <div class="ie-field"><label>用途 *</label><el-select v-model="form.usage" placeholder="请选择一个用途"><el-option label="主页素材" value="主页"/><el-option label="投流素材" value="投流"/></el-select><p>其他用途在后续实际使用时额外标注。</p></div>
     <div class="ie-field"><label>平台</label><multi-field v-model="form.platforms" :options="platformOptions"/></div>
     <div class="ie-field ie-wide"><label>预设成片方向</label><multi-field v-model="form.directions" :options="directionOptions"/><p>可暂不选择；上传每条成片时仍需单选一个方向。</p></div>
    </div></section>
    <section class="ie-section"><h3>业务归属</h3><div class="ie-grid">
     <div class="ie-field"><label>业务线</label><el-select v-model="form.line" clearable @change="changeLine"><el-option v-for="(v,k) in products" :key="k" :label="k" :value="k"/></el-select></div>
     <div class="ie-field"><label>业务线产品</label><el-select v-model="form.product" :disabled="!form.line" clearable @change="changeProduct"><el-option v-for="v in products[form.line]||[]" :key="v" :label="v" :value="v"/></el-select></div>
     <div class="ie-field"><label>出镜 IP</label><multi-field v-model="form.ip" :options="ipOptions()"/><p>可多选；切换业务线或产品后，请重新选择。</p></div>
     <div class="ie-field"><label>出镜素人</label><el-input v-model="form.amateur" clearable placeholder="手动输入姓名，多人用顿号分隔"/><p>可与出镜 IP 同时填写。</p></div>
    </div></section>
    <section class="ie-section" v-for="s in sections" :key="s.key">
     <div class="ie-heading"><h3>{{s.label}} <small>（{{form[s.key].length}}）</small></h3><el-button link type="primary" @click="add(s.key)">＋ 添加{{s.label}}</el-button></div>
     <p>{{s.key==='bodies'?'已完成脚本正文，正式入库至少填写一段。':'独立管理，可与其他内容复用，不强制配对。'}}</p>
     <div class="ie-empty" v-if="!form[s.key].length">暂无{{s.label}}，点击右上角添加。</div>
     <div class="ie-block" v-for="(b,i) in form[s.key]" :key="b.id">
      <div class="ie-block-head"><b>{{s.label}} {{i+1}}</b><span>
       <button class="ie-icon" type="button" :title="'清空'+s.label+'文字，保留输入框'" :aria-label="'清空'+s.label+(i+1)" @click="clear(s.key,i)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m14 3 7 7-11 11H5l-4-4L14 3Z M8 10l7 7M9 21h13"/></svg></button>
       <button class="ie-icon" type="button" :title="'删除此'+s.label+'内容块'" :aria-label="'删除'+s.label+(i+1)" @click="remove(s.key,i)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
      </span></div>
      <el-input v-model="b.text" :type="s.key==='titles'?'text':'textarea'" :autosize="{minRows:s.key==='bodies'?5:3,maxRows:16}" :placeholder="'请输入'+s.label"/>
      <details><summary>单独剪辑说明（选填）</summary><el-input v-model="b.note" type="textarea" :rows="2" placeholder="仅针对本段的镜号、音频或剪辑要求"/></details>
     </div>
    </section>
    <p role="alert" class="ie-error" v-if="error">{{error}}</p><p role="status" v-if="saved">{{saved}}</p>
    <p>当前只保存草稿。下一步添加拍摄素材组、上传原片，确认准备好后再入库和分配剪辑。</p>
    <div class="ie-actions"><el-button v-if="undo" link type="primary" @click="revert">撤销上次清空／删除</el-button><el-button @click="close">取消</el-button><el-button type="primary" @click="save('continue')">保存草稿并准备素材</el-button></div>
   </div>`
  });
  app.component('MultiField',window.MaterialMulti);
  app.use(ElementPlus,{locale:ElementPlusLocaleZhCn});app.mount('#iterationEditor');
 };
})();
