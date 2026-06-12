import {
  LayoutGrid,
  MessageSquare,
  LucideIcon,
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/board",
          label: "首頁",
          active: pathname === "/board" || pathname === "/board/",
          icon: LayoutGrid,
          submenus: [],
        },
        {
          href: "/board/chat",
          label: "聊天室語音朗讀",
          active: pathname === "/board/chat",
          icon: MessageSquare,
          submenus: [],
        },
      ],
    },
  ];
}
