export type PieceImage = { file: string; label: string; alt: string; format?: "png" | "webp" };
export type Piece = { id: string; name: string; category: "Denim" | "Outerwear" | "Objects"; kind: "trousers" | "jacket" | "bag" | "small-object"; description: string; images: PieceImage[] };

// Visual groupings and internal working names; descriptions await the designer.
export const pieces: Piece[] = [
  {
    "id": "04",
    "name": "Croc backpack",
    "category": "Objects",
    "kind": "bag",
    "description": "",
    "images": [
      {
        "file": "20-croc-backpack",
        "label": "Front",
        "alt": "Black crocodile embossed faux leather backpack with front zip pocket",
        "format": "webp"
      },
      {
        "file": "photo-217",
        "label": "Front",
        "alt": "Croc backpack, front view",
        "format": "webp"
      },
      {
        "file": "photo-218",
        "label": "Back",
        "alt": "Croc backpack, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "02",
    "name": "Red-lined black jacket",
    "category": "Outerwear",
    "kind": "jacket",
    "description": "",
    "images": [
      {
        "file": "16-black-jacket",
        "label": "Finished piece",
        "alt": "Black jacket with silver fasteners, trimmed chest pockets and red lining",
        "format": "webp"
      },
      {
        "file": "photo-184",
        "label": "Front",
        "alt": "Red-lined black jacket, front view",
        "format": "webp"
      },
      {
        "file": "photo-186",
        "label": "Back",
        "alt": "Red-lined black jacket, back view",
        "format": "webp"
      },
      {
        "file": "photo-185",
        "label": "Detail",
        "alt": "Red-lined black jacket, detail view",
        "format": "webp"
      },
      {
        "file": "photo-188",
        "label": "Back",
        "alt": "Red-lined black jacket, back view",
        "format": "webp"
      },
      {
        "file": "photo-187",
        "label": "Interior and construction",
        "alt": "Red-lined black jacket, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-189",
        "label": "Interior and construction",
        "alt": "Red-lined black jacket, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-190",
        "label": "Interior and construction",
        "alt": "Red-lined black jacket, interior and construction view",
        "format": "webp"
      },
      {
        "file": "15-jacket-construction",
        "label": "Construction",
        "alt": "Black jacket before collar and fasteners were attached",
        "format": "webp"
      },
      {
        "file": "photo-180",
        "label": "Interior and construction",
        "alt": "Red-lined black jacket, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-182",
        "label": "Interior and construction",
        "alt": "Red-lined black jacket, interior and construction view",
        "format": "webp"
      },
      {
        "file": "22-red-jacket-lining",
        "label": "Lining study",
        "alt": "Burgundy jacket lining shell with unfinished edges",
        "format": "webp"
      }
    ]
  },
  {
    "id": "06",
    "name": "Canvas shoulder bag",
    "category": "Objects",
    "kind": "bag",
    "description": "",
    "images": [
      {
        "file": "09-canvas-bag",
        "label": "Flat view",
        "alt": "Cream canvas shoulder bag with knotted broad strap and curved flap",
        "format": "webp"
      },
      {
        "file": "08-canvas-bag-standing",
        "label": "Standing view",
        "alt": "Upright cream canvas bag with straps draped in front",
        "format": "webp"
      },
      {
        "file": "photo-102",
        "label": "Interior and construction",
        "alt": "Canvas shoulder bag, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-103",
        "label": "Interior and construction",
        "alt": "Canvas shoulder bag, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "35",
    "name": "Floral quilted tote",
    "category": "Objects",
    "kind": "bag",
    "description": "",
    "images": [
      {
        "file": "photo-124",
        "label": "Front",
        "alt": "Floral quilted tote, front view",
        "format": "webp"
      },
      {
        "file": "photo-121",
        "label": "Interior and construction",
        "alt": "Floral quilted tote, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-122",
        "label": "Interior and construction",
        "alt": "Floral quilted tote, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-123",
        "label": "Interior and construction",
        "alt": "Floral quilted tote, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "20",
    "name": "Striped-pocket utility jeans",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-014",
        "label": "Front",
        "alt": "Striped-pocket utility jeans, front view",
        "format": "webp"
      },
      {
        "file": "photo-017",
        "label": "Back",
        "alt": "Striped-pocket utility jeans, back view",
        "format": "webp"
      },
      {
        "file": "photo-013",
        "label": "Detail",
        "alt": "Striped-pocket utility jeans, detail view",
        "format": "webp"
      },
      {
        "file": "photo-015",
        "label": "Detail",
        "alt": "Striped-pocket utility jeans, detail view",
        "format": "webp"
      },
      {
        "file": "photo-016",
        "label": "Interior and construction",
        "alt": "Striped-pocket utility jeans, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-018",
        "label": "Back",
        "alt": "Striped-pocket utility jeans, back view",
        "format": "webp"
      },
      {
        "file": "photo-019",
        "label": "Back",
        "alt": "Striped-pocket utility jeans, back view",
        "format": "webp"
      },
      {
        "file": "photo-020",
        "label": "Back",
        "alt": "Striped-pocket utility jeans, back view",
        "format": "webp"
      },
      {
        "file": "photo-021",
        "label": "Back",
        "alt": "Striped-pocket utility jeans, back view",
        "format": "webp"
      },
      {
        "file": "photo-022",
        "label": "Interior and construction",
        "alt": "Striped-pocket utility jeans, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-023",
        "label": "Interior and construction",
        "alt": "Striped-pocket utility jeans, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "21",
    "name": "Copper-button black jacket",
    "category": "Outerwear",
    "kind": "jacket",
    "description": "",
    "images": [
      {
        "file": "photo-029",
        "label": "Front",
        "alt": "Copper-button black jacket, front view",
        "format": "webp"
      },
      {
        "file": "photo-030",
        "label": "Front",
        "alt": "Copper-button black jacket, front view",
        "format": "webp"
      },
      {
        "file": "photo-032",
        "label": "Front",
        "alt": "Copper-button black jacket, front view",
        "format": "webp"
      },
      {
        "file": "photo-035",
        "label": "Back",
        "alt": "Copper-button black jacket, back view",
        "format": "webp"
      },
      {
        "file": "photo-031",
        "label": "Detail",
        "alt": "Copper-button black jacket, detail view",
        "format": "webp"
      },
      {
        "file": "photo-033",
        "label": "Front",
        "alt": "Copper-button black jacket, front view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "18",
    "name": "Patch-pocket indigo trousers",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-010",
        "label": "Front",
        "alt": "Patch-pocket indigo trousers, front view",
        "format": "webp"
      },
      {
        "file": "photo-008",
        "label": "Back",
        "alt": "Patch-pocket indigo trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-006",
        "label": "Detail",
        "alt": "Patch-pocket indigo trousers, detail view",
        "format": "webp"
      },
      {
        "file": "photo-007",
        "label": "Interior and construction",
        "alt": "Patch-pocket indigo trousers, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-009",
        "label": "Back",
        "alt": "Patch-pocket indigo trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-095",
        "label": "Back",
        "alt": "Patch-pocket indigo trousers, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "27",
    "name": "Olive utility trousers",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-082",
        "label": "Front",
        "alt": "Olive utility trousers, front view",
        "format": "webp"
      },
      {
        "file": "photo-081",
        "label": "Back",
        "alt": "Olive utility trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-083",
        "label": "Detail",
        "alt": "Olive utility trousers, detail view",
        "format": "webp"
      },
      {
        "file": "photo-084",
        "label": "Back",
        "alt": "Olive utility trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-080",
        "label": "Detail",
        "alt": "Olive utility trousers, detail view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "45",
    "name": "Patterned backpack",
    "category": "Objects",
    "kind": "bag",
    "description": "",
    "images": [
      {
        "file": "photo-220",
        "label": "Front",
        "alt": "Patterned backpack, front view",
        "format": "webp"
      },
      {
        "file": "photo-219",
        "label": "Front",
        "alt": "Patterned backpack, front view",
        "format": "webp"
      },
      {
        "file": "photo-221",
        "label": "Back",
        "alt": "Patterned backpack, back view",
        "format": "webp"
      },
      {
        "file": "photo-222",
        "label": "Interior and construction",
        "alt": "Patterned backpack, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-223",
        "label": "Interior and construction",
        "alt": "Patterned backpack, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-224",
        "label": "Front",
        "alt": "Patterned backpack, front view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "25",
    "name": "Speckled indigo denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-068",
        "label": "Front",
        "alt": "Speckled indigo denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-071",
        "label": "Back",
        "alt": "Speckled indigo denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-069",
        "label": "Detail",
        "alt": "Speckled indigo denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-073",
        "label": "Back",
        "alt": "Speckled indigo denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-070",
        "label": "Interior and construction",
        "alt": "Speckled indigo denim, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "03",
    "name": "Ecru utility trousers",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "18-ecru-denim-alt",
        "label": "Alternate view",
        "alt": "Alternate front view of ecru trousers",
        "format": "webp"
      },
      {
        "file": "19-ecru-back-detail",
        "label": "Back details",
        "alt": "Ecru rear patch pockets, leather waist patch and utility loop",
        "format": "webp"
      },
      {
        "file": "photo-210",
        "label": "Detail",
        "alt": "Ecru utility trousers, detail view",
        "format": "webp"
      },
      {
        "file": "photo-211",
        "label": "Interior and construction",
        "alt": "Ecru utility trousers, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-212",
        "label": "Interior and construction",
        "alt": "Ecru utility trousers, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-214",
        "label": "Back",
        "alt": "Ecru utility trousers, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "47",
    "name": "Ecru button-fly denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "04-ecru-denim",
        "label": "Front",
        "alt": "Natural ecru wide-leg jeans with metal button and rivets",
        "format": "webp"
      },
      {
        "file": "05-ecru-fly-detail",
        "label": "Button fly",
        "alt": "Copper button fly and red striped pocket lining detail",
        "format": "webp"
      }
    ]
  },
  {
    "id": "05",
    "name": "Cinch-back denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "13-cinch-trousers-front",
        "label": "Front",
        "alt": "Dark wide-leg trousers with a double-button waist",
        "format": "webp"
      },
      {
        "file": "14-cinch-trousers-back",
        "label": "Back",
        "alt": "Back of trousers with waist cinch, silver buckle and patch pockets",
        "format": "webp"
      },
      {
        "file": "photo-167",
        "label": "Back",
        "alt": "Cinch-back denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-168",
        "label": "Interior and construction",
        "alt": "Cinch-back denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-170",
        "label": "Back",
        "alt": "Cinch-back denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-171",
        "label": "Front",
        "alt": "Cinch-back denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-173",
        "label": "Detail",
        "alt": "Cinch-back denim, detail view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "07",
    "name": "Charcoal croc-patch denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "06-charcoal-denim",
        "label": "Front",
        "alt": "Charcoal wide-leg five-pocket trousers",
        "format": "webp"
      },
      {
        "file": "photo-066",
        "label": "Back",
        "alt": "Charcoal croc-patch denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-065",
        "label": "Detail",
        "alt": "Charcoal croc-patch denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-067",
        "label": "Back",
        "alt": "Charcoal croc-patch denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-072",
        "label": "Back",
        "alt": "Charcoal croc-patch denim, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "17",
    "name": "Indigo flap-pocket trousers",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-094",
        "label": "Front",
        "alt": "Indigo flap-pocket trousers, front view",
        "format": "webp"
      },
      {
        "file": "photo-002",
        "label": "Back",
        "alt": "Indigo flap-pocket trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-001",
        "label": "Detail",
        "alt": "Indigo flap-pocket trousers, detail view",
        "format": "webp"
      },
      {
        "file": "photo-003",
        "label": "Back",
        "alt": "Indigo flap-pocket trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-004",
        "label": "Back",
        "alt": "Indigo flap-pocket trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-005",
        "label": "Back",
        "alt": "Indigo flap-pocket trousers, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "22",
    "name": "Double-button denim shorts",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-040",
        "label": "Front",
        "alt": "Double-button denim shorts, front view",
        "format": "webp"
      },
      {
        "file": "photo-043",
        "label": "Back",
        "alt": "Double-button denim shorts, back view",
        "format": "webp"
      },
      {
        "file": "photo-041",
        "label": "Detail",
        "alt": "Double-button denim shorts, detail view",
        "format": "webp"
      },
      {
        "file": "photo-042",
        "label": "Detail",
        "alt": "Double-button denim shorts, detail view",
        "format": "webp"
      },
      {
        "file": "photo-044",
        "label": "Back",
        "alt": "Double-button denim shorts, back view",
        "format": "webp"
      },
      {
        "file": "photo-045",
        "label": "Back",
        "alt": "Double-button denim shorts, back view",
        "format": "webp"
      },
      {
        "file": "photo-046",
        "label": "Interior and construction",
        "alt": "Double-button denim shorts, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "16",
    "name": "Curved-pocket charcoal denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "11-charcoal-denim-alt",
        "label": "Front",
        "alt": "Charcoal wide-leg trousers with long curved pocket openings and metal rivets",
        "format": "webp"
      },
      {
        "file": "photo-148",
        "label": "Back",
        "alt": "Curved-pocket charcoal denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-146",
        "label": "Interior and construction",
        "alt": "Curved-pocket charcoal denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-147",
        "label": "Interior and construction",
        "alt": "Curved-pocket charcoal denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-149",
        "label": "Back",
        "alt": "Curved-pocket charcoal denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-150",
        "label": "Back",
        "alt": "Curved-pocket charcoal denim, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "09",
    "name": "Contrasting raw denim trousers",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "03-raw-denim",
        "label": "Front",
        "alt": "Dark indigo wide-leg jeans with black waistband and pocket facings",
        "format": "webp"
      },
      {
        "file": "photo-059",
        "label": "Front",
        "alt": "Contrasting raw denim trousers, front view",
        "format": "webp"
      },
      {
        "file": "photo-061",
        "label": "Back",
        "alt": "Contrasting raw denim trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-034",
        "label": "Front",
        "alt": "Contrasting raw denim trousers, front view",
        "format": "webp"
      },
      {
        "file": "photo-038",
        "label": "Back",
        "alt": "Contrasting raw denim trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-036",
        "label": "Detail",
        "alt": "Contrasting raw denim trousers, detail view",
        "format": "webp"
      },
      {
        "file": "photo-037",
        "label": "Detail",
        "alt": "Contrasting raw denim trousers, detail view",
        "format": "webp"
      },
      {
        "file": "photo-039",
        "label": "Back",
        "alt": "Contrasting raw denim trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-058",
        "label": "Interior and construction",
        "alt": "Contrasting raw denim trousers, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-060",
        "label": "Back",
        "alt": "Contrasting raw denim trousers, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "19",
    "name": "Classic indigo wide-leg denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-011",
        "label": "Front",
        "alt": "Classic indigo wide-leg denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-097",
        "label": "Back",
        "alt": "Classic indigo wide-leg denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-012",
        "label": "Interior and construction",
        "alt": "Classic indigo wide-leg denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-096",
        "label": "Detail",
        "alt": "Classic indigo wide-leg denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-098",
        "label": "Back",
        "alt": "Classic indigo wide-leg denim, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "10",
    "name": "Croc-trimmed black trousers",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "12-trim-trousers",
        "label": "Front",
        "alt": "Black wide-leg trousers with grey trimmed pocket openings",
        "format": "webp"
      },
      {
        "file": "photo-154",
        "label": "Front",
        "alt": "Croc-trimmed black trousers, front view",
        "format": "webp"
      },
      {
        "file": "photo-157",
        "label": "Back",
        "alt": "Croc-trimmed black trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-155",
        "label": "Interior and construction",
        "alt": "Croc-trimmed black trousers, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-156",
        "label": "Interior and construction",
        "alt": "Croc-trimmed black trousers, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-158",
        "label": "Interior and construction",
        "alt": "Croc-trimmed black trousers, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "41",
    "name": "Plaid-pocket indigo denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-164",
        "label": "Front",
        "alt": "Plaid-pocket indigo denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-166",
        "label": "Back",
        "alt": "Plaid-pocket indigo denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-159",
        "label": "Detail",
        "alt": "Plaid-pocket indigo denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-160",
        "label": "Back",
        "alt": "Plaid-pocket indigo denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-161",
        "label": "Interior and construction",
        "alt": "Plaid-pocket indigo denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-162",
        "label": "Interior and construction",
        "alt": "Plaid-pocket indigo denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-163",
        "label": "Interior and construction",
        "alt": "Plaid-pocket indigo denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-165",
        "label": "Front",
        "alt": "Plaid-pocket indigo denim, front view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "23",
    "name": "Double-button selvedge denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-047",
        "label": "Front",
        "alt": "Double-button selvedge denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-050",
        "label": "Back",
        "alt": "Double-button selvedge denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-048",
        "label": "Detail",
        "alt": "Double-button selvedge denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-049",
        "label": "Interior and construction",
        "alt": "Double-button selvedge denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-051",
        "label": "Back",
        "alt": "Double-button selvedge denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-052",
        "label": "Detail",
        "alt": "Double-button selvedge denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-054",
        "label": "Back",
        "alt": "Double-button selvedge denim, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "24",
    "name": "Welt-pocket cinch-back denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-053",
        "label": "Front",
        "alt": "Welt-pocket cinch-back denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-055",
        "label": "Back",
        "alt": "Welt-pocket cinch-back denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-063",
        "label": "Interior and construction",
        "alt": "Welt-pocket cinch-back denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-056",
        "label": "Back",
        "alt": "Welt-pocket cinch-back denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-057",
        "label": "Interior and construction",
        "alt": "Welt-pocket cinch-back denim, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "42",
    "name": "Black tailored cinch-back trousers",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-174",
        "label": "Front",
        "alt": "Black tailored cinch-back trousers, front view",
        "format": "webp"
      },
      {
        "file": "photo-178",
        "label": "Back",
        "alt": "Black tailored cinch-back trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-175",
        "label": "Detail",
        "alt": "Black tailored cinch-back trousers, detail view",
        "format": "webp"
      },
      {
        "file": "photo-176",
        "label": "Interior and construction",
        "alt": "Black tailored cinch-back trousers, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-177",
        "label": "Back",
        "alt": "Black tailored cinch-back trousers, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "43",
    "name": "Floral-pocket charcoal denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-191",
        "label": "Front",
        "alt": "Floral-pocket charcoal denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-196",
        "label": "Back",
        "alt": "Floral-pocket charcoal denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-192",
        "label": "Detail",
        "alt": "Floral-pocket charcoal denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-193",
        "label": "Interior and construction",
        "alt": "Floral-pocket charcoal denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-194",
        "label": "Detail",
        "alt": "Floral-pocket charcoal denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-195",
        "label": "Front",
        "alt": "Floral-pocket charcoal denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-197",
        "label": "Interior and construction",
        "alt": "Floral-pocket charcoal denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-198",
        "label": "Back",
        "alt": "Floral-pocket charcoal denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-199",
        "label": "Back",
        "alt": "Floral-pocket charcoal denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-200",
        "label": "Back",
        "alt": "Floral-pocket charcoal denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-201",
        "label": "Interior and construction",
        "alt": "Floral-pocket charcoal denim, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "44",
    "name": "Red-pocket black cargo trousers",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-202",
        "label": "Front",
        "alt": "Red-pocket black cargo trousers, front view",
        "format": "webp"
      },
      {
        "file": "photo-204",
        "label": "Back",
        "alt": "Red-pocket black cargo trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-203",
        "label": "Interior and construction",
        "alt": "Red-pocket black cargo trousers, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-205",
        "label": "Back",
        "alt": "Red-pocket black cargo trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-206",
        "label": "Back",
        "alt": "Red-pocket black cargo trousers, back view",
        "format": "webp"
      },
      {
        "file": "photo-207",
        "label": "Back",
        "alt": "Red-pocket black cargo trousers, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "08",
    "name": "Black selvedge denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "21-black-selvedge",
        "label": "Front",
        "alt": "Black wide-leg jeans with a white selvedge coin pocket edge",
        "format": "webp"
      },
      {
        "file": "photo-225",
        "label": "Front",
        "alt": "Black selvedge denim, front view",
        "format": "webp"
      },
      {
        "file": "photo-226",
        "label": "Detail",
        "alt": "Black selvedge denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-227",
        "label": "Detail",
        "alt": "Black selvedge denim, detail view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "46",
    "name": "Raw denim wide-leg study",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-062",
        "label": "Front",
        "alt": "Raw denim wide-leg study, front view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "26",
    "name": "Asymmetric pocket study",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "photo-079",
        "label": "Back",
        "alt": "Asymmetric pocket study, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "01",
    "name": "Cuffed indigo selvedge denim",
    "category": "Denim",
    "kind": "trousers",
    "description": "",
    "images": [
      {
        "file": "02-selvedge-denim",
        "label": "Front",
        "alt": "Indigo wide-leg selvedge jeans, copper hardware and pale turned cuffs",
        "format": "webp"
      },
      {
        "file": "photo-099",
        "label": "Back",
        "alt": "Cuffed indigo selvedge denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-024",
        "label": "Detail",
        "alt": "Cuffed indigo selvedge denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-025",
        "label": "Detail",
        "alt": "Cuffed indigo selvedge denim, detail view",
        "format": "webp"
      },
      {
        "file": "photo-026",
        "label": "Interior and construction",
        "alt": "Cuffed indigo selvedge denim, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-027",
        "label": "Back",
        "alt": "Cuffed indigo selvedge denim, back view",
        "format": "webp"
      },
      {
        "file": "photo-100",
        "label": "Back",
        "alt": "Cuffed indigo selvedge denim, back view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "13",
    "name": "Denim handbags",
    "category": "Objects",
    "kind": "bag",
    "description": "",
    "images": [
      {
        "file": "23-denim-handbag",
        "label": "Front",
        "alt": "Raw denim box handbag with arch handle and red contrast stitching",
        "format": "webp"
      },
      {
        "file": "photo-105",
        "label": "Front",
        "alt": "Denim handbags, front view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "11",
    "name": "Croc zip pouches",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "10-black-croc-pouch",
        "label": "Three-quarter view",
        "alt": "Black crocodile embossed zip pouch",
        "format": "webp"
      },
      {
        "file": "photo-127",
        "label": "Front",
        "alt": "Croc zip pouches, front view",
        "format": "webp"
      },
      {
        "file": "photo-128",
        "label": "Interior and construction",
        "alt": "Croc zip pouches, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-134",
        "label": "Front",
        "alt": "Croc zip pouches, front view",
        "format": "webp"
      },
      {
        "file": "photo-135",
        "label": "Interior and construction",
        "alt": "Croc zip pouches, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-136",
        "label": "Interior and construction",
        "alt": "Croc zip pouches, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-132",
        "label": "Front",
        "alt": "Croc zip pouches, front view",
        "format": "webp"
      },
      {
        "file": "photo-133",
        "label": "Interior and construction",
        "alt": "Croc zip pouches, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-138",
        "label": "Interior and construction",
        "alt": "Croc zip pouches, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-139",
        "label": "Front",
        "alt": "Croc zip pouches, front view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "12",
    "name": "Silver croc box pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "17-silver-croc-pouch",
        "label": "Three-quarter view",
        "alt": "Metallic silver crocodile embossed box pouch with white zipper",
        "format": "webp"
      },
      {
        "file": "photo-209",
        "label": "Interior and construction",
        "alt": "Silver croc box pouch, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "39",
    "name": "Red-lined croc box pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-142",
        "label": "Front",
        "alt": "Red-lined croc box pouch, front view",
        "format": "webp"
      },
      {
        "file": "photo-143",
        "label": "Interior and construction",
        "alt": "Red-lined croc box pouch, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-144",
        "label": "Interior and construction",
        "alt": "Red-lined croc box pouch, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "40",
    "name": "Blue-lined croc box pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-151",
        "label": "Front",
        "alt": "Blue-lined croc box pouch, front view",
        "format": "webp"
      },
      {
        "file": "photo-152",
        "label": "Interior and construction",
        "alt": "Blue-lined croc box pouch, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "28",
    "name": "Red-lined zip cases",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-085",
        "label": "Front",
        "alt": "Red-lined zip cases, front view",
        "format": "webp"
      },
      {
        "file": "photo-086",
        "label": "Interior and construction",
        "alt": "Red-lined zip cases, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-087",
        "label": "Interior and construction",
        "alt": "Red-lined zip cases, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "29",
    "name": "Denim wrist-strap pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-088",
        "label": "Front",
        "alt": "Denim wrist-strap pouch, front view",
        "format": "webp"
      },
      {
        "file": "photo-089",
        "label": "Interior and construction",
        "alt": "Denim wrist-strap pouch, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "14",
    "name": "Quilted zip pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "07-quilted-pouch",
        "label": "Three-quarter view",
        "alt": "Dark diamond quilted box pouch with silver zipper",
        "format": "webp"
      },
      {
        "file": "photo-090",
        "label": "Front",
        "alt": "Quilted zip pouch, front view",
        "format": "webp"
      },
      {
        "file": "photo-092",
        "label": "Interior and construction",
        "alt": "Quilted zip pouch, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-093",
        "label": "Interior and construction",
        "alt": "Quilted zip pouch, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "37",
    "name": "Monogram quilted box pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-129",
        "label": "Front",
        "alt": "Monogram quilted box pouch, front view",
        "format": "webp"
      },
      {
        "file": "photo-130",
        "label": "Detail",
        "alt": "Monogram quilted box pouch, detail view",
        "format": "webp"
      },
      {
        "file": "photo-131",
        "label": "Interior and construction",
        "alt": "Monogram quilted box pouch, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "31",
    "name": "Grey-lined box pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-107",
        "label": "Front",
        "alt": "Grey-lined box pouch, front view",
        "format": "webp"
      },
      {
        "file": "photo-110",
        "label": "Front",
        "alt": "Grey-lined box pouch, front view",
        "format": "webp"
      },
      {
        "file": "photo-108",
        "label": "Interior and construction",
        "alt": "Grey-lined box pouch, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-109",
        "label": "Interior and construction",
        "alt": "Grey-lined box pouch, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "38",
    "name": "Printed-lining denim box pouches",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-140",
        "label": "Interior and construction",
        "alt": "Printed-lining denim box pouches, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-141",
        "label": "Interior and construction",
        "alt": "Printed-lining denim box pouches, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "32",
    "name": "Quilted watch pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-111",
        "label": "Front",
        "alt": "Quilted watch pouch, front view",
        "format": "webp"
      },
      {
        "file": "photo-112",
        "label": "Interior and construction",
        "alt": "Quilted watch pouch, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-113",
        "label": "Interior and construction",
        "alt": "Quilted watch pouch, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "30",
    "name": "Blue-bound quilted envelope",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-106",
        "label": "Front",
        "alt": "Blue-bound quilted envelope, front view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "33",
    "name": "Purple-bound quilted envelope",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-114",
        "label": "Front",
        "alt": "Purple-bound quilted envelope, front view",
        "format": "webp"
      },
      {
        "file": "photo-115",
        "label": "Interior and construction",
        "alt": "Purple-bound quilted envelope, interior and construction view",
        "format": "webp"
      },
      {
        "file": "photo-116",
        "label": "Detail",
        "alt": "Purple-bound quilted envelope, detail view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "36",
    "name": "Red-bound quilted envelope",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-126",
        "label": "Front",
        "alt": "Red-bound quilted envelope, front view",
        "format": "webp"
      },
      {
        "file": "photo-125",
        "label": "Interior and construction",
        "alt": "Red-bound quilted envelope, interior and construction view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "34",
    "name": "Reversible denim and plaid cushion",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "photo-118",
        "label": "Front",
        "alt": "Reversible denim and plaid cushion, front view",
        "format": "webp"
      },
      {
        "file": "photo-120",
        "label": "Front",
        "alt": "Reversible denim and plaid cushion, front view",
        "format": "webp"
      },
      {
        "file": "photo-117",
        "label": "Front",
        "alt": "Reversible denim and plaid cushion, front view",
        "format": "webp"
      },
      {
        "file": "photo-119",
        "label": "Front",
        "alt": "Reversible denim and plaid cushion, front view",
        "format": "webp"
      }
    ]
  },
  {
    "id": "15",
    "name": "Denim button pouch",
    "category": "Objects",
    "kind": "small-object",
    "description": "",
    "images": [
      {
        "file": "01-denim-pouch",
        "label": "Front",
        "alt": "Small raw denim flap pouch with a yellow wooden button",
        "format": "webp"
      }
    ]
  }
];
