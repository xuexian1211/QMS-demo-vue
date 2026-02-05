<template>
    <div class="rich-text-editor">
        <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" class="editor-toolbar" />
        <Editor v-model="valueHtml" :defaultConfig="editorConfig" :mode="mode" class="editor-content"
            @onCreated="handleCreated" @onChange="handleChange" />
    </div>
</template>

<script setup lang="ts">
    import { ref, shallowRef, onBeforeUnmount, watch } from 'vue'
    import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
    import '@wangeditor/editor/dist/css/style.css'

    interface Props {
        modelValue: string
        placeholder?: string
        mode?: 'default' | 'simple'
        height?: number
    }

    const props = withDefaults(defineProps < Props > (), {
        placeholder: '请输入内容...',
        mode: 'default',
        height: 400
    })

    const emit = defineEmits < {
  (e: 'update:modelValue', value: string): void
}> ()

    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef()

    // 内容 HTML
    const valueHtml = ref(props.modelValue)

    // 工具栏配置
    const toolbarConfig = {
        excludeKeys: [
            'group-video', // 排除视频
        ]
    }

    // 编辑器配置
    const editorConfig = {
        placeholder: props.placeholder,
        MENU_CONF: {
            // 配置上传图片
            uploadImage: {
                // 自定义上传
                async customUpload(file: File, insertFn: any) {
                    // TODO: 实现图片上传
                    // 暂时使用 base64
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        const base64 = e.target?.result as string
                        insertFn(base64, file.name, base64)
                    }
                    reader.readAsDataURL(file)
                }
            }
        }
    }

    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
        const editor = editorRef.value
        if (editor == null) return
        editor.destroy()
    })

    // 编辑器创建完成
    const handleCreated = (editor: any) => {
        editorRef.value = editor
    }

    // 内容变化
    const handleChange = (editor: any) => {
        emit('update:modelValue', valueHtml.value)
    }

    // 监听外部值变化
    watch(() => props.modelValue, (newVal) => {
        if (newVal !== valueHtml.value) {
            valueHtml.value = newVal
        }
    })
</script>

<style scoped>
    .rich-text-editor {
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        overflow: hidden;
    }

    .editor-toolbar {
        border-bottom: 1px solid #d9d9d9;
        background: #fafafa;
    }

    .editor-content {
        height: v-bind('props.height + "px"');
        overflow-y: auto;
    }

    :deep(.w-e-text-container) {
        background-color: #fff;
    }

    :deep(.w-e-text-placeholder) {
        color: #bfbfbf;
    }

    :deep(.w-e-toolbar) {
        background-color: #fafafa !important;
    }
</style>