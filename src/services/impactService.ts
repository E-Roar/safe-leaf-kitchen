export interface ImpactMetrics {
  amount_g: number;
  polyphenols_mg: number;
  price_saved_MAD: number;
  co2e_kg_avoided: number;
}

export interface ImpactMessage {
  id: string;
  variables: string[];
  texts: {
    fr: string;
    en: string;
    ar: string;
  };
  formulas: {
    price_saved_MAD: string;
    co2e_kg_avoided: string;
  };
}

export interface ImpactConfig {
  meta: {
    package: string;
    version: string;
    currency: string;
    notes: string;
  };
  defaults: {
    price_per_kg_leaves_MAD: number;
    co2e_factor_kg_per_kg: number;
  };
  messages: ImpactMessage[];
}

class ImpactService {
  private static config: ImpactConfig = {
    meta: {
      package: "safeleaf-impact",
      version: "1.0.0",
      currency: "MAD",
      notes: "Variables: {amount_g}, {polyphenols_mg}, {price_saved_MAD}, {co2e_kg_avoided}. Arabic is RTL."
    },
    defaults: {
      price_per_kg_leaves_MAD: 50,
      co2e_factor_kg_per_kg: 1.0
    },
    messages: [
      {
        id: "impact_tip",
        variables: ["amount_g", "polyphenols_mg", "price_saved_MAD", "co2e_kg_avoided"],
        texts: {
          fr: "Déjà {amount_g} g de fanes sauvées = +{polyphenols_mg} mg polyphénols, ~{price_saved_MAD} MAD économisés et {co2e_kg_avoided} kg CO₂e évités !",
          en: "{amount_g} g leaves saved = +{polyphenols_mg} mg polyphenols, ~{price_saved_MAD} MAD saved and {co2e_kg_avoided} kg CO₂e avoided!",
          ar: "‏{amount_g} غرام من الأوراق المُنقَذة = ‎+{polyphenols_mg} ملغ بوليفينولات، توفير يقارب ‎{price_saved_MAD} درهم، وتجنّب {co2e_kg_avoided} كغ CO₂e!"
        },
        formulas: {
          price_saved_MAD: "(amount_g / 1000) * price_per_kg_leaves_MAD",
          co2e_kg_avoided: "(amount_g / 1000) * co2e_factor_kg_per_kg"
        }
      }
    ]
  };

  // Calculate impact metrics for a given amount of leaves
  static calculateImpact(amount_g: number, polyphenols_mg: number): ImpactMetrics {
    const price_saved_MAD = (amount_g / 1000) * this.config.defaults.price_per_kg_leaves_MAD;
    const co2e_kg_avoided = (amount_g / 1000) * this.config.defaults.co2e_factor_kg_per_kg;

    return {
      amount_g,
      polyphenols_mg,
      price_saved_MAD: Math.round(price_saved_MAD * 100) / 100, // Round to 2 decimal places
      co2e_kg_avoided: Math.round(co2e_kg_avoided * 100) / 100
    };
  }

  // Get formatted impact message in specified language
  static getImpactMessage(metrics: ImpactMetrics, language: 'en' | 'fr' | 'ar' = 'en'): string {
    const message = this.config.messages.find(m => m.id === 'impact_tip');
    if (!message) return '';

    let text = message.texts[language];
    
    // Replace variables with actual values
    text = text.replace('{amount_g}', metrics.amount_g.toString());
    text = text.replace('{polyphenols_mg}', metrics.polyphenols_mg.toString());
    text = text.replace('{price_saved_MAD}', metrics.price_saved_MAD.toString());
    text = text.replace('{co2e_kg_avoided}', metrics.co2e_kg_avoided.toString());
    
    return text;
  }

  // Get cumulative impact from all detected leaves
  static getCumulativeImpact(): ImpactMetrics {
    const detectedLeaves = this.getDetectedLeavesData();
    
    let totalAmount_g = 0;
    let totalPolyphenols_mg = 0;
    
    Object.entries(detectedLeaves).forEach(([leafType, count]) => {
      // Estimate 50g per leaf detection (average leaf weight)
      const leafWeight_g = 50;
      totalAmount_g += count * leafWeight_g;
      
      // Estimate polyphenols based on leaf type (simplified)
      const polyphenolsPerLeaf_mg = this.getPolyphenolsPerLeaf(leafType);
      totalPolyphenols_mg += count * polyphenolsPerLeaf_mg;
    });

    return this.calculateImpact(totalAmount_g, totalPolyphenols_mg);
  }

  // Get polyphenols content per leaf type (simplified estimates)
  private static getPolyphenolsPerLeaf(leafType: string): number {
    const polyphenolsMap: Record<string, number> = {
      'onion': 160,
      'garlic': 140,
      'leek': 120,
      'chive': 100,
      'scallion': 110,
      'shallot': 130,
      'wild garlic': 150,
      'ramp': 125,
      'green onion': 105
    };

    // Find best match for leaf type
    for (const [key, value] of Object.entries(polyphenolsMap)) {
      if (leafType.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return 120; // Default average
  }

  // Get detected leaves data from storage
  private static getDetectedLeavesData(): Record<string, number> {
    try {
      const data = localStorage.getItem('safeleaf_detected_leaves');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  // Get configuration
  static getConfig(): ImpactConfig {
    return this.config;
  }

  // Update configuration (for future customization)
  static updateConfig(newConfig: Partial<ImpactConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export { ImpactService };
