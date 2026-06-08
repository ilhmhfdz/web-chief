'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useState } from 'react';
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Image as ImageIcon, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto px-4 py-3 bg-white',
      },
    },
  });

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          
          editor?.chain().focus().setImage({ src: data.url }).run();
          toast.success('Gambar berhasil diunggah');
        } catch (error: any) {
          toast.error(error.message);
        } finally {
          setIsUploading(false);
        }
      }
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-surface-raised rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-surface-sub" />
      </div>
    );
  }

  const ToolbarButton = ({ onClick, isActive = false, icon: Icon, disabled = false, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive ? 'bg-surface-ink text-white' : 'text-surface-ink hover:bg-surface-raised'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col border border-surface-muted/60 rounded-lg overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-ground border-b border-surface-muted/60">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={Strikethrough}
          title="Strikethrough"
        />
        
        <div className="w-px h-5 bg-surface-muted mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          title="Heading 3"
        />

        <div className="w-px h-5 bg-surface-muted mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={AlignLeft}
          title="Align Left"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={AlignCenter}
          title="Align Center"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={AlignRight}
          title="Align Right"
        />

        <div className="w-px h-5 bg-surface-muted mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Ordered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="Quote"
        />

        <div className="w-px h-5 bg-surface-muted mx-1" />

        <button
          type="button"
          onClick={addImage}
          disabled={isUploading}
          title="Add Image"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors text-surface-ink hover:bg-surface-raised disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          <span className="text-xs font-semibold">Image</span>
        </button>
      </div>

      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}
