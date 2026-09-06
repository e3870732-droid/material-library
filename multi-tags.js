(() => {
 const css=document.createElement('style');
 css.textContent=`
 .mt-tags{display:flex;align-items:center;gap:4px;min-width:0;width:100%;overflow:hidden;flex-wrap:nowrap}
 .mt-chip{display:inline-flex;gap:4px;align-items:center;max-width:100%;padding:2px 6px;background:#f2f3f5;border-radius:4px;color:#4e5969;font-size:13px;white-space:nowrap;box-sizing:border-box}
 .mt-chip span{overflow:hidden;text-overflow:ellipsis}.mt-chip button{border:0;background:none;padding:0;color:#86909c;cursor:pointer}
 .mt-dots{border:0;background:#f2f3f5;border-radius:4px;padding:2px 6px;color:#4e5969;flex-shrink:0;cursor:pointer}
 .mt-measure{position:absolute;visibility:hidden;pointer-events:none;white-space:nowrap;display:flex;gap:4px}
 .mt-full{display:flex;gap:6px;flex-wrap:wrap;max-width:380px;max-height:240px;overflow:auto}
 .mt-control{width:100%;min-width:0}.mt-control .el-select__wrapper{height:40px;min-height:40px;flex-wrap:nowrap}
 .library-filter-primary .mt-control .el-select__wrapper,.library-filter-secondary .mt-control .el-select__wrapper{height:44px;min-height:44px;border-radius:6px;box-shadow:none;background:#fff}
 .mt-control .el-select__selection{flex-wrap:nowrap;min-width:0}.mt-control .el-select__input-wrapper{position:absolute;width:1px;opacity:0}
 .mt-control.mt-creatable .el-select__input-wrapper{position:relative;width:72px;min-width:40px;opacity:1;flex-shrink:0}
 `;document.head.append(css);
 window.MaterialMulti={
  props:['modelValue','options','placeholder','creatable','disabled'],emits:['update:modelValue'],
  setup(props,{emit}){
   const host=Vue.ref(null),measure=Vue.ref(null),count=Vue.ref(0);
   const vals=Vue.computed(()=>props.modelValue||[]);
   const opts=Vue.computed(()=>(props.options||[]).map(o=>typeof o==='string'?{value:o,label:o}:o));
   const label=v=>opts.value.find(o=>o.value===v)?.label||v;
   const recalc=()=>{if(!host.value||!measure.value)return;let used=0,n=0;const widths=[...measure.value.children].map(x=>x.getBoundingClientRect().width+4),total=widths.reduce((a,b)=>a+b,0),available=host.value.clientWidth-(total>host.value.clientWidth?32:0);for(const w of widths){if(used+w>available)break;used+=w;n++}count.value=n};
   let observer;
   Vue.onMounted(()=>{observer=new ResizeObserver(recalc);if(host.value)observer.observe(host.value);recalc()});
   Vue.watch(host,el=>{observer?.disconnect();if(el)observer?.observe(el);Vue.nextTick(recalc)});
   Vue.onBeforeUnmount(()=>observer?.disconnect());
   Vue.watch(()=>[...vals.value],()=>Vue.nextTick(recalc),{flush:'post'});
   const remove=v=>emit('update:modelValue',vals.value.filter(x=>x!==v));
   const all=Vue.computed(()=>opts.value.length>0&&opts.value.every(o=>vals.value.includes(o.value)));
   return {host,measure,count,vals,opts,label,remove,all,toggle:()=>emit('update:modelValue',all.value?[]:opts.value.map(o=>o.value))};
  },
  template:`<el-select class="mt-control" :class="{'mt-creatable':creatable}" :disabled="disabled" :filterable="!!creatable" :allow-create="!!creatable" default-first-option :model-value="modelValue" @update:model-value="$emit('update:modelValue',$event)" multiple clearable :placeholder="placeholder||'请选择'">
   <template #tag><div class="mt-tags" ref="host"><span class="mt-chip" v-for="v in vals.slice(0,count)" :key="v"><span>{{label(v)}}</span><button type="button" :aria-label="'移除'+label(v)" @click.stop="remove(v)">×</button></span>
    <el-tooltip v-if="count<vals.length" effect="light" placement="bottom" :show-after="150" :enterable="true"><template #content><div class="mt-full"><span v-for="v in vals" :key="v" class="mt-chip"><span>{{label(v)}}</span><button type="button" :aria-label="'移除'+label(v)" @click.stop="remove(v)">×</button></span></div></template><button type="button" class="mt-dots" aria-label="查看全部已选标签" @click.stop>…</button></el-tooltip>
    <span class="mt-measure" ref="measure"><span v-for="v in vals" :key="v" class="mt-chip">{{label(v)}} ×</span></span>
   </div></template>
   <template #header><el-checkbox :model-value="all" :indeterminate="!!vals.length&&!all" @change="toggle">全部</el-checkbox></template>
   <el-option v-for="o in opts" :key="o.value" :label="o.label" :value="o.value"/>
  </el-select>`
 };
 const old=enhanceFilterSelects;let apps=[];
 enhanceFilterSelects=function(panel){
  apps.forEach(a=>a.unmount());apps=[];old(panel);
  panel.querySelectorAll('.filter-select').forEach(w=>{
   const n=w.querySelector('select');if(!n||n.id==='uploadDate')return;
   const options=[...n.options].filter(o=>o.value).map(o=>({label:o.textContent,value:o.value}));
   const placeholder=n.options[0]?.textContent;
   [...w.children].filter(c=>c!==n).forEach(c=>c.remove());
   const mount=document.createElement('div');w.prepend(mount);
   const a=Vue.createApp({setup(){const v=Vue.ref([...n.selectedOptions].map(o=>o.value));return()=>Vue.h(MaterialMulti,{modelValue:v.value,options,placeholder,'onUpdate:modelValue':value=>{v.value=value;[...n.options].forEach(o=>o.selected=value.includes(o.value));n.dispatchEvent(new Event('change',{bubbles:true}))}})}});
   a.use(ElementPlus,{locale:ElementPlusLocaleZhCn});a.mount(mount);apps.push(a);
  });
 };
})();
