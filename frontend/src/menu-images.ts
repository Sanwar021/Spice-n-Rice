import type { Item } from "./design-data";

// Menu-only defaults: one reviewed image for each existing dish.
// A new owner-uploaded image still takes precedence over the original seed image.
const menuPhotos: Record<string, { image: string; previousImage: string }> = {
  "Biriyanis/Vegetable Biriyani": {
    "image": "/images/menu-specific/vegetable-biriyani.webp",
    "previousImage": ""
  },
  "Biriyanis/Chicken Biriyani": {
    "image": "/images/menu-printed/biryani.webp",
    "previousImage": "/images/menu-printed/biryani.webp"
  },
  "Biriyanis/Chicken (Boneless) Biriyani": {
    "image": "/images/menu-specific/chicken-boneless-biriyani.webp",
    "previousImage": ""
  },
  "Biriyanis/Goat Biriyani": {
    "image": "/images/menu-specific/goat-biriyani.webp",
    "previousImage": ""
  },
  "Biriyanis/Goat Kacchi Biriyani": {
    "image": "/images/menu-specific/goat-kacchi-biriyani.webp",
    "previousImage": ""
  },
  "Biriyanis/Beef Biriyani": {
    "image": "/images/menu-specific/beef-biriyani.webp",
    "previousImage": ""
  },
  "Biriyanis/Beef Tehari": {
    "image": "/images/menu-specific/beef-tehari.webp",
    "previousImage": ""
  },
  "Biriyanis/Shrimp Biriyani": {
    "image": "/images/menu-specific/shrimp-biriyani.webp",
    "previousImage": ""
  },
  "Biriyanis/Morog Pulao": {
    "image": "/images/menu-specific/morog-pulao.webp",
    "previousImage": ""
  },
  "Non-Veg/Chicken Karahi": {
    "image": "/images/menu-printed/chicken-karahi.webp",
    "previousImage": "/images/menu-printed/chicken-karahi.webp"
  },
  "Non-Veg/Chicken Karahi (Boneless)": {
    "image": "/images/menu-specific/chicken-karahi-boneless.webp",
    "previousImage": "/images/menu-printed/chicken-karahi.webp"
  },
  "Non-Veg/Chicken Korma": {
    "image": "/images/menu-specific/chicken-korma.webp",
    "previousImage": ""
  },
  "Non-Veg/Chicken Korma (Boneless)": {
    "image": "/images/menu-specific/chicken-korma-boneless.webp",
    "previousImage": ""
  },
  "Non-Veg/Buttered Chicken": {
    "image": "/images/menu-specific/buttered-chicken.webp",
    "previousImage": ""
  },
  "Non-Veg/Chicken 65": {
    "image": "/images/menu-specific/chicken-65.webp",
    "previousImage": ""
  },
  "Non-Veg/Chicken Roast": {
    "image": "/images/menu-specific/chicken-roast.webp",
    "previousImage": ""
  },
  "Non-Veg/Mezbani Beef Curry": {
    "image": "/images/menu-specific/mezbani-beef-curry.webp",
    "previousImage": ""
  },
  "Non-Veg/Haleem": {
    "image": "/images/menu-specific/haleem.webp",
    "previousImage": ""
  },
  "Non-Veg/Goat Karahi": {
    "image": "/images/menu-specific/goat-karahi.webp",
    "previousImage": ""
  },
  "Non-Veg/Goat Korma": {
    "image": "/images/menu-specific/goat-korma.webp",
    "previousImage": ""
  },
  "Non-Veg/Kala Bhuna": {
    "image": "/images/menu-specific/kala-bhuna.webp",
    "previousImage": ""
  },
  "Grilled/Tandoori Chicken Leg (2 pieces)": {
    "image": "/images/menu-specific/tandoori-chicken-legs.webp",
    "previousImage": ""
  },
  "Grilled/Chicken Boti": {
    "image": "/images/menu-specific/chicken-boti.webp",
    "previousImage": ""
  },
  "Grilled/Chicken Shish Kabab": {
    "image": "/images/menu-printed/seekh-kabab.webp",
    "previousImage": "/images/menu-printed/seekh-kabab.webp"
  },
  "Grilled/Beef Boti": {
    "image": "/images/menu-specific/beef-boti.webp",
    "previousImage": ""
  },
  "Grilled/Beef Shish Kabab": {
    "image": "/images/menu-specific/beef-shish-kabab.webp",
    "previousImage": "/images/menu-printed/seekh-kabab.webp"
  },
  "Grilled/Mixed Grill": {
    "image": "/images/menu-specific/mixed-grill.webp",
    "previousImage": ""
  },
  "Naan Wraps/Paneer Wrap": {
    "image": "/images/menu-specific/paneer-wrap.webp",
    "previousImage": ""
  },
  "Naan Wraps/Chicken Boti Wrap": {
    "image": "/images/menu-printed/chicken-wrap.webp",
    "previousImage": "/images/menu-printed/chicken-wrap.webp"
  },
  "Naan Wraps/Chicken Kebab Wrap": {
    "image": "/images/menu-specific/chicken-kebab-wrap.webp",
    "previousImage": ""
  },
  "Naan Wraps/Beef Kabab Wrap": {
    "image": "/images/menu-specific/beef-kabab-wrap.webp",
    "previousImage": ""
  },
  "Naan Wraps/Gyro Wrap": {
    "image": "/images/menu-specific/gyro-wrap.webp",
    "previousImage": ""
  },
  "Naan Wraps/Gyro Combo": {
    "image": "/images/menu-specific/gyro-combo.webp",
    "previousImage": ""
  },
  "Veg/Saag Paneer": {
    "image": "/images/menu-specific/saag-paneer.webp",
    "previousImage": ""
  },
  "Veg/Paneer Masala": {
    "image": "/images/menu-specific/paneer-masala.webp",
    "previousImage": ""
  },
  "Veg/Muttar Paneer": {
    "image": "/images/menu-specific/muttar-paneer.webp",
    "previousImage": ""
  },
  "Veg/Mixed Vegetable": {
    "image": "/images/menu-specific/mixed-vegetable.webp",
    "previousImage": ""
  },
  "Veg/Navratan Korma": {
    "image": "/images/menu-specific/navratan-korma.webp",
    "previousImage": ""
  },
  "Veg/Aloo Gobi": {
    "image": "/images/menu-printed/vegetables.webp",
    "previousImage": "/images/menu-printed/vegetables.webp"
  },
  "Veg/Chana Masala": {
    "image": "/images/menu-specific/chana-masala.webp",
    "previousImage": ""
  },
  "Veg/Bhuna Daal": {
    "image": "/images/menu-specific/bhuna-daal.webp",
    "previousImage": ""
  },
  "Veg/Malai Vegetable Kofta": {
    "image": "/images/menu-specific/malai-vegetable-kofta.webp",
    "previousImage": ""
  },
  "Fish/Ruhi Fish Curry": {
    "image": "/images/menu-specific/ruhi-fish-curry.webp",
    "previousImage": ""
  },
  "Fish/Whole Tilapia Fish Curry": {
    "image": "/images/menu-specific/whole-tilapia-curry.webp",
    "previousImage": ""
  },
  "Fish/Hilsha Fish Curry": {
    "image": "/images/menu-specific/hilsha-fish-curry.webp",
    "previousImage": ""
  },
  "Fish/Pomphret Curry or Fry": {
    "image": "/images/menu-specific/pomfret-fry.webp",
    "previousImage": ""
  },
  "Fish/Shrimp Curry": {
    "image": "/images/menu-specific/shrimp-curry.webp",
    "previousImage": ""
  },
  "Fish/Shrimp Malai Curry": {
    "image": "/images/menu-specific/shrimp-malai-curry.webp",
    "previousImage": ""
  },
  "Snacketizers/Vegetable Samosa (each)": {
    "image": "/images/menu-printed/samosa.webp",
    "previousImage": "/images/menu-printed/samosa.webp"
  },
  "Snacketizers/Chicken Samosa (each)": {
    "image": "/images/menu-specific/chicken-samosa.webp",
    "previousImage": ""
  },
  "Snacketizers/Beef Samosa (each)": {
    "image": "/images/menu-specific/beef-samosa.webp",
    "previousImage": ""
  },
  "Snacketizers/Kolija Samosa (2pc)": {
    "image": "/images/menu-specific/kolija-samosa.webp",
    "previousImage": ""
  },
  "Snacketizers/Potato Cutlet (each)": {
    "image": "/images/menu-specific/potato-cutlet.webp",
    "previousImage": ""
  },
  "Snacketizers/Chicken Wings (6pc)": {
    "image": "/images/menu-specific/chicken-wings.webp",
    "previousImage": ""
  },
  "Snacketizers/Daal Puri (5pc)": {
    "image": "/images/menu-specific/daal-puri.webp",
    "previousImage": ""
  },
  "Snacketizers/Samosa Chaat": {
    "image": "/images/menu-specific/samosa-chaat.webp",
    "previousImage": ""
  },
  "Snacketizers/Tikki Chaat": {
    "image": "/images/menu-specific/tikki-chaat.webp",
    "previousImage": ""
  },
  "Snacketizers/Chole Bhatura": {
    "image": "/images/menu-specific/chole-bhatura.webp",
    "previousImage": ""
  },
  "Sides/Steamed Rice": {
    "image": "/images/menu-specific/steamed-rice.webp",
    "previousImage": ""
  },
  "Sides/Pulao Rice": {
    "image": "/images/menu-specific/pulao-rice.webp",
    "previousImage": ""
  },
  "Sides/Khichuri Rice": {
    "image": "/images/menu-specific/khichuri-rice.webp",
    "previousImage": ""
  },
  "Sides/Naan": {
    "image": "/images/menu-printed/naan.webp",
    "previousImage": "/images/menu-printed/naan.webp"
  },
  "Sides/Garlic Naan": {
    "image": "/images/menu-printed/garlic-naan.webp",
    "previousImage": "/images/menu-printed/garlic-naan.webp"
  },
  "Sides/Paratha (2 Pieces)": {
    "image": "/images/menu-specific/paratha.webp",
    "previousImage": ""
  },
  "Beverages/Soft Drinks (can)": {
    "image": "/images/menu-specific/soft-drink-can.webp",
    "previousImage": ""
  },
  "Beverages/Bottled Water": {
    "image": "/images/menu-specific/bottled-water.webp",
    "previousImage": ""
  },
  "Beverages/Masala Tea": {
    "image": "/images/menu-printed/chai.webp",
    "previousImage": "/images/menu-printed/chai.webp"
  },
  "Beverages/Lassi": {
    "image": "/images/menu-specific/lassi.webp",
    "previousImage": ""
  },
  "Children’s/Chicken Nuggets with Fries": {
    "image": "/images/menu-specific/chicken-nuggets-fries.webp",
    "previousImage": ""
  },
  "Children’s/Chicken Tenders (5)": {
    "image": "/images/menu-printed/chicken-tenders.webp",
    "previousImage": "/images/menu-printed/chicken-tenders.webp"
  }
};

export function menuItemName(item: Pick<Item, "category" | "name">): string {
  if (item.category === "Biriyanis" && /^(Beef Tehari|Morog Pulao) Biriyani$/.test(item.name)) {
    return item.name.replace(/ Biriyani$/, "");
  }
  if (item.category === "Naan Wraps" && item.name === "Chicken Kebab") {
    return "Chicken Kebab Wrap";
  }
  return item.name;
}

export function menuItemImage(item: Pick<Item, "category" | "name" | "image" | "images">): string {
  const entry = menuPhotos[item.category + "/" + menuItemName(item)];
  const selected = (Array.isArray(item.images) ? item.images.find((url) => typeof url === "string" && url.length > 0) : undefined) || item.image;
  if (selected && selected !== entry?.previousImage && !/^\/images\/design\/food-[0-3](?:-\d+)?\.webp$/.test(selected)) {
    return selected;
  }
  return entry?.image || selected || "";
}
