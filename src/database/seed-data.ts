// Demo menu seeded on first start (see PrismaService.seedDatabase).
// Prices are in GEL.

export interface SeedMenuItem {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  modifiers: { name: string; price: number }[];
}

export interface SeedMenuCategory {
  name: string;
  items: SeedMenuItem[];
}

export const seedMenu: SeedMenuCategory[] = [
  {
    name: 'Appetizers',
    items: [
      {
        name: 'Badrijani Nigvzit',
        description:
          'Fried eggplant rolls delicately stuffed with spiced walnut paste, garlic, and garnished with fresh pomegranate seeds.',
        price: 12,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCxnk073R7r-RWm2E2Npqa63zFXvI3zuX2-lZ5qgnl0J3tzOmARgNM7txIfD6F3q4fbYe_NxGX18CPo6nf2a32Bd-Bg1ZgUkJEoJ7ITa3dtqpqSOWHVRNzrPec6WH4bEnpRB3DkJ9Djg9B1BLPf0wW2AnIs4xAKTgGCZtn8jwx8GNj9fCPJ_Vlu0BpyzHZHFzEpCr2p87hzdbql9q3X2AYc9k2fg1FWbUKkWCibRHNDnvpKOHaQhwvRpDlpOOPYykio9o-QWmepjjt3',
        modifiers: [],
      },
      {
        name: 'Assorted Pkhali',
        description:
          'A traditional platter of minced vegetables (spinach, beet, beans) mixed with walnut paste and Georgian spices.',
        price: 14,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAIeHGdyT3e4RaFbGHU62gxjL5uVxbAQQQP5FeeXVNYQ4zx72a-mfrS6sIq-V5GiDizQV2XMh4CekmRn5T-ptK1j9l0xc7D64tPY44C-xFpZr4eRTjzDb6qX9Ljty7Oc092rVFjU7PqUDHWz1bezGUxAuMOO10o79d2cBMWwfYrCb0KDU9T7y-Db5YSh-6AqPDFn-N31TQ_FJq6vUPpl3cvohbR5le2VJPEuyjcMGmAQBSPEgQT1ukBsz9VNfhkmqoqRl2N2RrRMyuR',
        modifiers: [{ name: 'Mchadi (cornbread)', price: 3 }],
      },
      {
        name: 'Georgian Salad',
        description:
          'Fresh tomatoes and cucumbers tossed with purple basil, onions, and a rich walnut dressing.',
        price: 10,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD5zplqNiQlOAVqc82hpe03Y5CLYSQFgJGpjcmI5iCQUNErs753TS-_CECxVltiSNcKIbporX2URoBUd7HMF5_0fU1rKI4xKOpl0b1IXbidHRpmUXSJSUMdYwR_yhA8-NUKqZFu-5HCpL7fhFPDrLvxFtdUhDCD1NSUrClAGHGLmoCnZ-9_aBLcmZqIJrdue2YId1g0xJwAy-hH_dFIAaAWKCvSQ_QHqD4BYNkwfMPprMwv5WJJkxU9a4kYDWiB_P923HdHhpCSDeZF',
        modifiers: [{ name: 'Walnut dressing', price: 2 }],
      },
    ],
  },
  {
    name: 'Mains',
    items: [
      {
        name: 'Kalakuri Khinkali (5pcs)',
        description:
          'Iconic Georgian dumplings filled with spiced minced meat (beef & pork), fresh herbs, and savory broth.',
        price: 15,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA-2p-XYx9quscKv5p7rHfBfr0cAsW2ZYaSgCmBe4yEh34iznzEwIoo-XDeqyU3i42fjXka5kr1fUAdLJ-1rrhFztX5VEp4tXFPg_Lj_td0dZxB3zT9kNUkPmeiDGG9j8BRox3Ky-7fsgd7HdXwer32kJDVz-ea5n_q7MP9IGtS3JHh1jMPh4UHDuA_W_KnrmlpCCd6hNEWTjWyQYKMYxz6Kk202g0gINQfoQj1YOoTp836knA08KoyDAw4uuOHu4Ajx0WE2D2vcXUY',
        modifiers: [{ name: '+5 pieces', price: 15 }, { name: 'Extra black pepper', price: 0 }],
      },
      {
        name: 'Shkmeruli',
        description:
          'Roasted chicken fried in a traditional clay pan, smothered in a rich and creamy garlic sauce.',
        price: 22,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDwDgNjaJ2yT4E8xBAGm7vbo6eOEgkceJK0dK9qm1q8jyI1OkeMZaNXTQWVHDVR4iGANPCb9k9xsG3vVQmsgJAQYL1CfRTwZnZOhObiWl899OMcXzqYnjr1Tf53-dXoddXDMNodK0INl51hPdWJL2MEZS_HH6NhFB8sCO-hwNBKWhO1NXvFkXAAS9tobe60byX78X5q_pr1HPKejv0frWQBfl95mPGRk3WJAZ0F0s1NHfENKnYQCkzGlrafIfSHNBnMccmpCTz1A8Yh',
        modifiers: [{ name: 'Extra garlic sauce', price: 2 }, { name: 'Mchadi (cornbread)', price: 3 }],
      },
      {
        name: 'Ostri',
        description:
          'A spicy, hot beef stew cooked with tomato sauce, pickles, coriander, and garlic.',
        price: 18,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBP3VF1QtTqUx1957kL40l1WP3LHaR8OGjTbBlLNFL2LJqSl8rsXPiHqjGf2AD3_40V5o7U-_1dNCY-CPizUnR4KaaUqBwJqtN8x9MOvB8bZyHMTbvJE0l81sXgv551KgRzK6c0hOAr9wb3ruZtxr2WTIu1dLApnaFO7vjAuNJjCs_wWAl0wCahBHywyQZZBas-lv2NYlKj5sJb98z15i3gEx-2DoBTxxBMTDQttOIRk8XD0-ev90PAm_ksxzBcHHiREu083-4L5bYi',
        modifiers: [{ name: 'Extra spicy', price: 0 }, { name: 'Shoti bread', price: 2 }],
      },
      {
        name: 'Pork Mtsvadi',
        description:
          'Traditional Georgian pork skewers grilled over vine wood coals, served with tkemali sauce and onions.',
        price: 19,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBZMMoEeGZXkoNbxaWW5975l_NTAx0xXWp_b0BfD32TiZqmRGtS-x7C5HePi3Ha66dY2i9N5xKL6UguTbbHhU9B3G7uj_3CSM8p0ZuzKNlc2Ggk_JUi8lOQr4riwv60HTiza3NWjXBCX_unjJBXlKt8Qaa3TWpG-qc1mWXDwQx5rg7ZMgZwNTrGMchxrKXF6D3D0NbtyvcyeDX5au4xFJQiUPHYtlvdbkq5FWi4VyjhKKq_jqeKBstWEa4N6Rsw3lK1eIr4BUjHLMVS',
        modifiers: [{ name: 'Tkemali sauce', price: 2 }, { name: 'Grilled vegetables', price: 5 }],
      },
    ],
  },
  {
    name: 'Pastry & Dough',
    items: [
      {
        name: 'Adjarian Khachapuri',
        description:
          'Traditional boat-shaped dough topped with sulguni cheese, butter, and a runny organic egg.',
        price: 18,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA8Ql4yjA8xhjcWEpf3aJ5vzVpCj9S9ZXFCw7AnFxweyBf7l0rDA717g9ggHD2AS2LHSFQ3Mca1q3BBSe-q1UaabVNbL7AS98sWd5aLSjOp5JfFBxZBUmx6tE6wnJmZ1VdoiW7QrG_3Enx8HG7TOZwPmknbygYU4XHCUF2UXjh4s_zRUNJbL7RthEtuvemftgKQYkX9e38zLtZTJI0kGwqcBJOH6EasrDUwlWoGTRJBC1xyImoDibXnCSDpTq5yrp-m6bCmXiCWlYRU',
        modifiers: [{ name: 'Extra egg', price: 1.5 }, { name: 'Extra butter', price: 1 }, { name: 'Extra sulguni', price: 3 }],
      },
      {
        name: 'Imeruli Khachapuri',
        description:
          'A classic round Georgian cheese bread, soft, fluffy, and filled with melted Imeretian cheese.',
        price: 16,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA_lCzOWuQ8yGOHYK_Q_dIGEEzsAPBvM5l3n6NbgSfVwuzsCPzsJnGz7BiWF2jGdYAl4R1EC1sTxrFVqL0QGUpnZ6l-GnqS4yvmDKwAjJblb41djW9Zl2Ra_gnZVlWP7eIcl2lF5jqAlMnXF8xcyF5lnUK4a5rwchVGYqM1O8wOBz_e4pQlm9hnWQ16Nc497YTexnVW8iodMYkLcgBt20fI1QoEXxW8K3nGdJabWmfRnqfnk5IprzuHYMyL-Yw3QVjcVO5nuKiJnKtq',
        modifiers: [{ name: 'Extra sulguni', price: 3 }],
      },
      {
        name: 'Lobiani',
        description:
          'Flavorful bread filled with mashed kidney beans, onions, and spices, baked in a clay oven.',
        price: 14,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDTlBZkhE4-qtdf-EAWuC8gtU7jHr0csLmEjrc1etRKPYkZecmJnpHPqbopYBv7fc--h7x6RM2jWZWi1zt7-OebFIQHciBbe8EGz24rgzFtYUaT0B2MWoPdp6ZspWeiGqzs_hBNrNWULjV8LGILtUfWK_bgWK1mUT2xw0dnEipfeWJjbQyy4PFzoiLkyVvYoCuFNyDRBYUtkAn_yaI24N4umf4VQY9U2yq906wC-v9u8HroiVjpP0QF2Exze-fhIxzaxzaJExsBOuvW',
        modifiers: [{ name: 'Pickled vegetables (mzhave)', price: 3 }],
      },
    ],
  },
  {
    name: 'Desserts',
    items: [
      {
        name: 'Churchkhela',
        description:
          'Traditional candle-shaped candy. Walnuts are threaded onto a string, dipped in thickened grape juice, and dried.',
        price: 8,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuABxQR3OK21sklu_a2lVBpv6D3UAT6V3HzQCSWpvg6D-9ClVMnJG_7_8FVi-FMi6znIq1ScMMavhR0AUQ_Wm_TkqHFZYI0d119LpxnuQZgYzTBVd-d2wkz1_8mjkIPZ2wUaNQsdUrD49b6FYsT0bpekc4zqbgDz2uPN2CdACLdQN3Coxotye1DmI02_29PMUg8iR7KCN2NNq-Jy1FOvEYr1_WJicc2XjuNUjjiTfZ1Mq6Q6S9VIw-ufdvyuZKVPTsi4BmoaoZoIaOTb',
        modifiers: [],
      },
      {
        name: 'Honey Cake (Medovik)',
        description:
          'Layers of honey-infused sponge cake with a light sour cream frosting and walnut crumbs.',
        price: 10,
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuC-ZtJW2lq83RHefpdQDUN3ZXXY-4UlnYnIxDfjRRWu1v9jByKpnWMdIqdZBdNXmbSDmfdujuBKI0P8xCHSFmIYKN5XMruOrGvIGRGKPwrB-6IQSK2z2z9PxIRjzQQxrXDhLdD3H2ukOsjAuPAVMr-JC_bdHpDyseCI9UJVxICu0hdzK0-DSDyI7yZyZsmtTWpwaJvkglyaXuyIIYQSurSy1f2mCh47o8AdPx5AKstTOXlnsUV4ZhLY4e6UDR3ic4xTON7jmJD48Rs6',
        modifiers: [{ name: 'Scoop of vanilla ice cream', price: 3 }],
      },
    ],
  },
];
