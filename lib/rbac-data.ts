// Copied from the handoff fixtures (admin-modules.json, admin-roles.json). Keep in sync with the API.
import type { AdminModule, Role } from "./permissions.ts";

export const MODULES_DATA = [
  {
    "key": "dash",
    "name": "Dashboard",
    "desc": "Ringkasan dan antrian kerja",
    "availableActions": [
      "view"
    ],
    "superOnly": false
  },
  {
    "key": "em",
    "name": "Data emiten",
    "desc": "Profil, sumber pendapatan, laporan keuangan, IPO",
    "availableActions": [
      "view",
      "edit",
      "publish",
      "delete"
    ],
    "superOnly": false
  },
  {
    "key": "tm",
    "name": "Tema & rantai nilai",
    "desc": "Tahap, emiten per tahap, porsi pendapatan",
    "availableActions": [
      "view",
      "edit",
      "publish",
      "delete"
    ],
    "superOnly": false
  },
  {
    "key": "usr",
    "name": "Pengguna",
    "desc": "Akun beta, undangan, tangguhkan akun",
    "availableActions": [
      "view",
      "edit",
      "delete"
    ],
    "superOnly": true
  },
  {
    "key": "fb",
    "name": "Masukan & laporan",
    "desc": "Tiket dari form Bantuan",
    "availableActions": [
      "view",
      "edit",
      "delete"
    ],
    "superOnly": false
  },
  {
    "key": "log",
    "name": "Riwayat perubahan",
    "desc": "Lihat dan kembalikan perubahan",
    "availableActions": [
      "view",
      "edit"
    ],
    "superOnly": false
  },
  {
    "key": "sync",
    "name": "Sinkron data BEI",
    "desc": "Jalankan sinkron, tinjau perubahan BEI",
    "availableActions": [
      "view",
      "edit"
    ],
    "superOnly": false
  },
  {
    "key": "set",
    "name": "Pengaturan aplikasi",
    "desc": "Merek, landing page, mode aplikasi",
    "availableActions": [
      "view",
      "edit",
      "publish"
    ],
    "superOnly": true
  },
  {
    "key": "acc",
    "name": "Akses & peran",
    "desc": "Undang anggota, ubah peran dan izin",
    "availableActions": [
      "view",
      "edit",
      "delete"
    ],
    "superOnly": true
  }
] as AdminModule[];

export const ROLES_DATA = [
  {
    "id": "super",
    "name": "Super admin",
    "system": true,
    "desc": "Punya semua izin dan tidak bisa diubah. Batasi ke 1–2 orang.",
    "perms": {
      "dash": [
        "view"
      ],
      "em": [
        "view",
        "edit",
        "publish",
        "delete"
      ],
      "tm": [
        "view",
        "edit",
        "publish",
        "delete"
      ],
      "usr": [
        "view",
        "edit",
        "delete"
      ],
      "fb": [
        "view",
        "edit",
        "delete"
      ],
      "log": [
        "view",
        "edit"
      ],
      "sync": [
        "view",
        "edit"
      ],
      "set": [
        "view",
        "edit",
        "publish"
      ],
      "acc": [
        "view",
        "edit",
        "delete"
      ]
    }
  },
  {
    "id": "data",
    "name": "Admin data",
    "system": true,
    "desc": "Mengurus data emiten dan tema sampai terbit. Tidak bisa mengatur akses atau pengaturan aplikasi.",
    "perms": {
      "dash": [
        "view"
      ],
      "em": [
        "view",
        "edit",
        "publish",
        "delete"
      ],
      "tm": [
        "view",
        "edit",
        "publish"
      ],
      "usr": [
        "view"
      ],
      "fb": [
        "view",
        "edit"
      ],
      "log": [
        "view"
      ],
      "sync": [
        "view",
        "edit"
      ],
      "set": [
        "view"
      ],
      "acc": []
    }
  },
  {
    "id": "tema",
    "name": "Editor tema",
    "system": false,
    "desc": "Menyusun tema dan rantai nilai. Perubahannya harus diterbitkan Admin data.",
    "perms": {
      "dash": [
        "view"
      ],
      "em": [
        "view"
      ],
      "tm": [
        "view",
        "edit"
      ],
      "usr": [],
      "fb": [],
      "log": [
        "view"
      ],
      "sync": [],
      "set": [],
      "acc": []
    }
  },
  {
    "id": "support",
    "name": "Support",
    "system": false,
    "desc": "Membalas tiket dan membantu pengguna. Tidak bisa mengubah data emiten.",
    "perms": {
      "dash": [
        "view"
      ],
      "em": [
        "view"
      ],
      "tm": [],
      "usr": [
        "view",
        "edit",
        "delete"
      ],
      "fb": [
        "view",
        "edit",
        "delete"
      ],
      "log": [
        "view"
      ],
      "sync": [],
      "set": [],
      "acc": []
    }
  },
  {
    "id": "view",
    "name": "Viewer",
    "system": false,
    "desc": "Bisa melihat semua modul kecuali akses, tanpa mengubah apa pun.",
    "perms": {
      "dash": [
        "view"
      ],
      "em": [
        "view"
      ],
      "tm": [
        "view"
      ],
      "usr": [
        "view"
      ],
      "fb": [
        "view"
      ],
      "log": [
        "view"
      ],
      "sync": [
        "view"
      ],
      "set": [
        "view"
      ],
      "acc": []
    }
  }
] as Omit<Role, "sub">[];
