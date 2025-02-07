import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
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
          href: "/dashboard",
          label: "首頁",
          active: pathname.includes("/dashboard"),
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "主播功能",
      menus: [
        {
          href: "",
          label: "實況管理",
          active: pathname.includes("/posts"),
          icon: SquarePen,
          submenus: [
            {
              href: "/board/clips",
              label: "所有剪輯",
              active: pathname === "/board/clips",
            },
            {
              href: "/board/clips-manager",
              label: "剪輯管理",
              active: pathname === "/board/clips-manager",
            },
          ],
        },
        {
          href: "",
          label: "歐付寶斗內區",
          active: pathname.includes("/categories"),
          icon: Bookmark,
          submenus: [
            {
              href: "/board/settings/opay",
              label: "OPay",
              active: pathname === "/board/settings/opay",
            },
          ],
        },
        {
          href: "/settings/opay",
          label: "歐付寶設定",
          active: pathname.includes("/settings/opay"),
          icon: Tag,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "設定",
      menus: [
        {
          href: "/users",
          label: "Users",
          active: pathname.includes("/users"),
          icon: Users,
          submenus: [],
        },
        {
          href: "/account",
          label: "Account",
          active: pathname.includes("/account"),
          icon: Settings,
          submenus: [],
        },
      ],
    },
  ];
}
