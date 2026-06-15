<template>
  <div class="rich-editor">
    <div class="toolbar">
      <a-space wrap>
        <a-button size="small" @click="exec('bold')">Bold</a-button>
        <a-button size="small" @click="exec('italic')">Italic</a-button>
        <a-button size="small" @click="exec('underline')">Underline</a-button>
        <a-button size="small" @click="exec('insertUnorderedList')">Bullets</a-button>
        <a-button size="small" @click="exec('insertOrderedList')">Numbering</a-button>
        <a-button size="small" @click="exec('outdent')">Outdent</a-button>
        <a-button size="small" @click="exec('indent')">Indent</a-button>
        <a-button size="small" @click="clearFormatting">Clear</a-button>
      </a-space>
    </div>

    <div
      ref="editorRef"
      class="editor-area"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="handleInput"
      @blur="handleInput"
      @paste="handlePaste"
    ></div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string | null
  placeholder?: string
}>(), {
  modelValue: '',
  placeholder: 'Write formatted content here...',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'plain-text': [value: string]
}>()

const editorRef = ref<HTMLElement | null>(null)
const syncing = ref(false)

watch(
  () => props.modelValue,
  (value) => {
    if (!editorRef.value || syncing.value) return

    const html = value || ''

    if (editorRef.value.innerHTML !== html) {
      editorRef.value.innerHTML = html
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = props.modelValue || ''
  }
})

const handleInput = () => {
  if (!editorRef.value) return

  syncing.value = true

  emit('update:modelValue', editorRef.value.innerHTML)
  emit('plain-text', editorRef.value.innerText || '')

  nextTick(() => {
    syncing.value = false
  })
}

const exec = (command: string) => {
  document.execCommand(command, false)
  handleInput()
}

const clearFormatting = () => {
  document.execCommand('removeFormat', false)
  handleInput()
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()

  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)

  handleInput()
}
</script>

<style scoped>
.rich-editor {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #ffffff;
}

.toolbar {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}

.editor-area {
  min-height: 160px;
  padding: 12px;
  outline: none;
  overflow: auto;
}

.editor-area:empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
}
</style>