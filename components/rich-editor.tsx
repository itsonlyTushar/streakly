"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
}

const ToolbarButton = ({
  onClick,
  isActive,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={cn(
      "p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5",
      isActive
        ? "text-primary bg-black/5 dark:bg-white/5"
        : "text-muted-foreground",
    )}
  >
    {children}
  </button>
);

export function RichEditor({
  content,
  onChange,
  placeholder,
  className,
  wrapperClassName,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Describe your progress...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    immediatelyRender: false,
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm dark:prose-invert focus:outline-none max-w-none min-h-[150px] p-6 text-lg font-medium",
          className,
        ),
      },
    },
  });

  // Sync content from parent (e.g. when cleared)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only update if it's a programmatic change (like clearing after save)
      // to avoid cursor jumps during typing.
      if (content === "" || content === "<p></p>") {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border border-border/50 rounded-3xl overflow-hidden bg-secondary/30 focus-within:ring-4 ring-primary/5 transition-all relative flex flex-col", wrapperClassName)}>
      <div className="flex items-center flex-wrap gap-1 p-2 border-b border-border/30 bg-secondary/10 shrink-0">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="flex-1 min-h-0 overflow-y-auto" />
    </div>
  );
}
