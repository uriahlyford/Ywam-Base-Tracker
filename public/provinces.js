// The 25 first-level administrative divisions of Cambodia (24 provinces + the
// capital), with the official NCDD gazetteer spellings.
//
// `present: true` marks the 13 where YWAM Cambodia currently has work. Those are
// the only ones the picker offers, because a leader choosing from 25 has to read
// past twelve places YWAM has never been to find theirs. The other twelve are
// still here, still valid, and one tap away behind "Show all 25 provinces" —
// starting work somewhere new must not mean it cannot be reported. The server
// validates against all 25 for the same reason.
window.PROVINCES = [
  { id: "banteay-meanchey", name: "Banteay Meanchey", nameKhmer: "បន្ទាយមានជ័យ", present: true },
  { id: "battambang", name: "Battambang", nameKhmer: "បាត់ដំបង", present: true },
  { id: "kampong-cham", name: "Kampong Cham", nameKhmer: "កំពង់ចាម", present: true },
  { id: "kampong-chhnang", name: "Kampong Chhnang", nameKhmer: "កំពង់ឆ្នាំង", present: true },
  { id: "kampong-speu", name: "Kampong Speu", nameKhmer: "កំពង់ស្ពឺ" },
  { id: "kampong-thom", name: "Kampong Thom", nameKhmer: "កំពង់ធំ" },
  { id: "kampot", name: "Kampot", nameKhmer: "កំពត", present: true },
  { id: "kandal", name: "Kandal", nameKhmer: "កណ្ដាល" },
  { id: "kep", name: "Kep", nameKhmer: "កែប" },
  { id: "koh-kong", name: "Koh Kong", nameKhmer: "កោះកុង", present: true },
  { id: "kratie", name: "Kratié", nameKhmer: "ក្រចេះ" },
  { id: "mondulkiri", name: "Mondulkiri", nameKhmer: "មណ្ឌលគិរី" },
  { id: "oddar-meanchey", name: "Oddar Meanchey", nameKhmer: "ឧត្ដរមានជ័យ" },
  { id: "pailin", name: "Pailin", nameKhmer: "ប៉ៃលិន", present: true },
  { id: "phnom-penh", name: "Phnom Penh", nameKhmer: "រាជធានីភ្នំពេញ", present: true },
  { id: "preah-sihanouk", name: "Preah Sihanouk (Sihanoukville)", nameKhmer: "ព្រះសីហនុ" },
  { id: "preah-vihear", name: "Preah Vihear", nameKhmer: "ព្រះវិហារ", present: true },
  { id: "prey-veng", name: "Prey Veng", nameKhmer: "ព្រៃវែង" },
  { id: "pursat", name: "Pursat", nameKhmer: "ពោធិ៍សាត់", present: true },
  { id: "ratanakiri", name: "Ratanakiri", nameKhmer: "រតនគិរី" },
  { id: "siem-reap", name: "Siem Reap", nameKhmer: "សៀមរាប", present: true },
  { id: "stung-treng", name: "Stung Treng", nameKhmer: "ស្ទឹងត្រែង", present: true },
  { id: "svay-rieng", name: "Svay Rieng", nameKhmer: "ស្វាយរៀង" },
  { id: "takeo", name: "Takéo", nameKhmer: "តាកែវ", present: true },
  { id: "tboung-khmum", name: "Tboung Khmum", nameKhmer: "ត្បូងឃ្មុំ" },
];
