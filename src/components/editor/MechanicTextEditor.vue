<template>
  <div class="mechanic-text-editor" :class="$attrs.class" :style="$attrs.style as StyleValue" data-enter-local>
    <q-input v-if="!rich" v-bind="$attrs" :model-value="modelValue" :label="label" @update:model-value="value => emitValue(String(value ?? ''))">
      <template v-for="(_, name) in forwardedSlots" #[name]="scope"><slot :name="name" v-bind="scope || {}" /></template>
      <template #append><slot name="append" /><q-btn type="button" flat dense size="sm" icon="format_bold" label="Format" :disable="Boolean($attrs.disable || $attrs.readonly)" :aria-label="'Format '+label" @click.stop="formatting = true"><q-tooltip>Format this text</q-tooltip></q-btn></template>
    </q-input>
    <div v-else class="mechanic-text-editor__formatted">
      <div class="row items-center justify-between q-mb-xs"><span class="text-caption">{{ label }}</span><slot name="append" /></div>
      <q-editor :disable="Boolean($attrs.disable)" :readonly="Boolean($attrs.readonly)" :model-value="editorValue" :toolbar="toolbar" min-height="3rem" :content-class="'mechanic-text-editor__content'" :aria-label="label" @keydown.stop @keyup.stop @update:model-value="value => emitValue(mechanicRichHtml(value))" />
    </div>
  </div>
</template>
<script lang="ts">
import type { StyleValue } from 'vue'
import {computed,defineComponent,ref,useSlots} from 'vue'
import {hasMechanicFormatting,mechanicRichHtml} from 'src/core/domain/mechanic-rich-text'
export default defineComponent({
 name:'MechanicTextEditor',inheritAttrs:false,
 props:{modelValue:{type:[String,Number],default:''},label:{type:String,default:'Mechanic text'},forceRich:{type:Boolean,default:false}},
 emits:['update:modelValue'],
 setup(props,{emit}){
  const formatting=ref(false),slots=useSlots()
  const forwardedSlots=Object.fromEntries(Object.entries(slots).filter(([name])=>name!=='append'))
  const rich=computed(()=>props.forceRich||formatting.value||hasMechanicFormatting(props.modelValue))
  const editorValue=computed(()=>mechanicRichHtml(props.modelValue))
  const toolbar=[['bold','italic','underline','strike'],['subscript','superscript'],['unordered','ordered'],['undo','redo','removeFormat']]
  const emitValue=(value:string)=>emit('update:modelValue',value)
  return{formatting,rich,editorValue,toolbar,forwardedSlots,emitValue,mechanicRichHtml}
 }
})
</script>
<style scoped>
.mechanic-text-editor { min-width:0; width:100%; }
.mechanic-text-editor__formatted :deep(.q-editor__toolbars-container) { overflow-x:auto; }
.mechanic-text-editor__formatted :deep(.q-editor__toolbar) { flex-wrap:wrap; }
.mechanic-text-editor__formatted :deep(.q-editor__content) { overflow-wrap:anywhere; }
</style>
