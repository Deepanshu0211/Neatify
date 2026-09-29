import { useEffect, useRef, useState } from "react";
import {
  File,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  FileCode,
  Archive,
  Folder,
} from "lucide-react";
import { Move, folderName, desktop } from "../lib/workspace";
import { Menu } from "@tauri-apps/api/menu";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
const ROW = 48;
export default function VirtualFileList({
  items,
  onSelect,
  selectedSource,
}: {
  items: Move[];
  onSelect?: (item: Move) => void;
  selectedSource?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const menuRef = useRef<Menu | null>(null);
  useEffect(
    () => () => {
      void menuRef.current?.close();
    },
    [],
  );
  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(400);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setHeight(entries[0].contentRect.height),
    );
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (host.current) host.current.scrollTop = 0;
    setTop(0);
  }, [items]);
  useEffect(() => {
    setSelected(selectedSource || "");
  }, [selectedSource]);
  const start = Math.max(0, Math.floor(top / ROW) - 6),
    end = Math.min(items.length, Math.ceil((top + height) / ROW) + 6);
  function select(item: Move) {
    setSelected(item.source);
    onSelect?.(item);
  }
  async function context(item: Move) {
    select(item);
    if (!desktop) return;
    await menuRef.current?.close();
    const menu = await Menu.new({
      items: [
        {
          id: "reveal",
          text: "Show in File Explorer",
          action: () => {
            void revealItemInDir(item.source);
          },
        },
        {
          id: "copy",
          text: "Copy path",
          action: () => {
            void navigator.clipboard.writeText(item.source);
          },
        },
      ],
    });
    menuRef.current = menu;
    await menu.popup();
  }
  return (
    <div
      className="virtual-files"
      ref={host}
      role="grid"
      aria-label="Files to organize"
      aria-rowcount={items.length}
      tabIndex={0}
      onScroll={(e) => setTop(e.currentTarget.scrollTop)}
      onKeyDown={(e) => {
        if (
          !["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) ||
          !items.length
        )
          return;
        e.preventDefault();
        let index = items.findIndex((i) => i.source === selected);
        index =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? items.length - 1
              : Math.max(
                  0,
                  Math.min(
                    items.length - 1,
                    index + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                );
        select(items[index]);
        if (host.current) {
          if (index * ROW < top) host.current.scrollTop = index * ROW;
          else if ((index + 1) * ROW > top + height)
            host.current.scrollTop = (index + 1) * ROW - height;
        }
      }}
    >
      <div style={{ height: items.length * ROW, position: "relative" }}>
        {items.slice(start, end).map((item, i) => {
          const ext = item.extension.toLowerCase();
          const Icon = /png|jpg|jpeg|gif|webp|svg/.test(ext)
            ? FileImage
            : /mp3|wav|flac/.test(ext)
              ? FileAudio
              : /mp4|mov|mkv/.test(ext)
                ? FileVideo
                : /zip|rar|7z/.test(ext)
                  ? Archive
                  : /js|ts|py|rs|html|css/.test(ext)
                    ? FileCode
                    : /pdf|doc|txt|md/.test(ext)
                      ? FileText
                      : File;
          return (
            <div
              role="row"
              aria-rowindex={start + i + 1}
              aria-selected={selected === item.source}
              className="file-row"
              key={item.source}
              style={{
                position: "absolute",
                top: (start + i) * ROW,
                height: ROW,
                width: "100%",
              }}
              onClick={() => select(item)}
              onContextMenu={(e) => {
                e.preventDefault();
                void context(item);
              }}
            >
              <span role="gridcell" title={item.source}>
                <Icon size={19} />
                {folderName(item.source)}
              </span>
              <span role="gridcell" title={item.destination}>
                <Folder size={17} />
                {item.category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
