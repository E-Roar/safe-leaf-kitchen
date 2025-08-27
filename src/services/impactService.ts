export interface ImpactMetrics {
  amount_g: number;
  polyphenols_mg: number;
  price_saved_MAD: number;
  co2e_kg_avoided: number;
  calories_saved: number;
  fiber_g: number;
  vitamin_c_mg: number;
  iron_mg: number;
  calcium_mg: number;
  methane_kg_avoided: number;
  water_liters_saved: number;
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
    methane_factor_kg_per_kg: number;
    water_factor_liters_per_kg: number;
  };
  messages: ImpactMessage[];
}

class ImpactService {
  private static config: ImpactConfig = {
    meta: {
      package: "safeleaf-impact",
      version: "3.0.0",
      currency: "MAD",
      notes: "Enhanced impact metrics with economic, environmental, and nutritional indicators based on Moroccan market data"
    },
    defaults: {
      price_per_kg_leaves_MAD: 120, // Updated: Realistic price for organic leaves in Morocco
      co2e_factor_kg_per_kg: 3.2,   // Updated: CO2 equivalent for organic waste decomposition + transport
      methane_factor_kg_per_kg: 0.8, // Methane emissions from organic waste in landfills
      water_factor_liters_per_kg: 250 // Water saved by not growing commercial vegetables
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
    // Validate inputs
    if (amount_g < 0) amount_g = 0;
    if (polyphenols_mg < 0) polyphenols_mg = 0;

    // Economic impact
    const price_saved_MAD = (amount_g / 1000) * this.config.defaults.price_per_kg_leaves_MAD;
    
    // Environmental impact
    const co2e_kg_avoided = (amount_g / 1000) * this.config.defaults.co2e_factor_kg_per_kg;
    const methane_kg_avoided = (amount_g / 1000) * this.config.defaults.methane_factor_kg_per_kg;
    const water_liters_saved = (amount_g / 1000) * this.config.defaults.water_factor_liters_per_kg;
    
    // Nutritional metrics (based on research data for leafy greens)
    const calories_saved = amount_g * 0.23; // ~23 calories per 100g of leafy greens
    const fiber_g = amount_g * 0.025; // ~2.5g fiber per 100g
    const vitamin_c_mg = amount_g * 0.18; // ~18mg vitamin C per 100g
    const iron_mg = amount_g * 0.0035; // ~3.5mg iron per 100g
    const calcium_mg = amount_g * 0.095; // ~95mg calcium per 100g

    return {
      amount_g: Math.round(amount_g * 10) / 10, // Round to 1 decimal place
      polyphenols_mg: Math.round(polyphenols_mg * 10) / 10,
      price_saved_MAD: Math.round(price_saved_MAD * 100) / 100, // Round to 2 decimal places
      co2e_kg_avoided: Math.round(co2e_kg_avoided * 100) / 100,
      calories_saved: Math.round(calories_saved * 10) / 10,
      fiber_g: Math.round(fiber_g * 100) / 100,
      vitamin_c_mg: Math.round(vitamin_c_mg * 10) / 10,
      iron_mg: Math.round(iron_mg * 100) / 100,
      calcium_mg: Math.round(calcium_mg * 10) / 10,
      methane_kg_avoided: Math.round(methane_kg_avoided * 100) / 100,
      water_liters_saved: Math.round(water_liters_saved * 10) / 10
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
    try {
      const detectedLeaves = this.getDetectedLeavesData();
      console.log('ImpactService: Calculating impact for detected leaves:', detectedLeaves);
      
      // Validate the detected leaves data
      if (!detectedLeaves || typeof detectedLeaves !== 'object') {
        console.warn('ImpactService: Invalid detected leaves data:', detectedLeaves);
        return this.calculateImpact(0, 0);
      }
      
      const leafEntries = Object.entries(detectedLeaves);
      if (leafEntries.length === 0) {
        console.log('ImpactService: No detected leaves found, returning zero impact');
        return this.calculateImpact(0, 0);
      }
      
      let totalAmount_g = 0;
      let totalPolyphenols_mg = 0;
      
      leafEntries.forEach(([leafType, count]) => {
        if (!leafType || typeof leafType !== 'string') {
          console.warn(`ImpactService: Invalid leaf type: ${leafType}`);
          return;
        }
        
        const numCount = Number(count);
        if (isNaN(numCount) || numCount <= 0) {
          console.warn(`ImpactService: Invalid count for ${leafType}: ${count}`);
          return;
        }
        
        // Estimate leaf weight based on type (more realistic estimates)
        const leafWeight_g = this.getLeafWeightEstimate(leafType);
        const leafAmount_g = numCount * leafWeight_g;
        totalAmount_g += leafAmount_g;
        
        // Estimate polyphenols based on leaf type (more accurate estimates)
        const polyphenolsPerLeaf_mg = this.getPolyphenolsPerLeaf(leafType);
        const leafPolyphenols_mg = numCount * polyphenolsPerLeaf_mg;
        totalPolyphenols_mg += leafPolyphenols_mg;
        
        console.log(`ImpactService: ${leafType} (${numCount}x) → ${leafAmount_g}g, ${leafPolyphenols_mg}mg polyphenols`);
      });
      
      const result = this.calculateImpact(totalAmount_g, totalPolyphenols_mg);
      console.log('ImpactService: Final impact metrics:', result);
      
      return result;
    } catch (error) {
      console.error('ImpactService: Error calculating cumulative impact:', error);
      return this.calculateImpact(0, 0);
    }
  }

  // Get leaf weight estimate per leaf type (more realistic estimates)
  private static getLeafWeightEstimate(leafType: string): number {
    const weightMap: Record<string, number> = {
      // Exact detection class names
      'Onion Leaves': 30,
      'Garlic Leaves': 25,
      'Leek Leaves': 45,
      'Chive Leaves': 20,
      'Scallion Leaves': 35,
      'Shallot Leaves': 30,
      
      // Alternative names for flexibility
      'onion': 30,      // Onion leaves are typically 25-35g
      'garlic': 25,     // Garlic leaves are 20-30g
      'leek': 45,       // Leek leaves are larger 40-50g
      'chive': 20,      // Chive leaves are very thin 15-25g
      'scallion': 35,   // Scallion leaves are medium 30-40g
      'shallot': 30,    // Similar to onion 25-35g
      'wild garlic': 28, // Similar to garlic 25-30g
      'ramp': 40,       // Ramps are larger 35-45g
      'green onion': 32, // Similar to scallion 30-35g
      'carrot': 35,     // Carrot tops 30-40g
      'beet': 40,       // Beet greens 35-45g
      'radish': 25,     // Radish greens 20-30g
      'turnip': 30,     // Turnip greens 25-35g
      'parsley': 20,    // Parsley 15-25g
      'cilantro': 18,   // Cilantro 15-20g
      'mint': 15,       // Mint leaves 10-20g
      'basil': 12,      // Basil leaves 10-15g
      'thyme': 8,       // Thyme 5-10g
      'oregano': 10,    // Oregano 8-12g
      'sage': 12        // Sage 10-15g
    };

    // First try exact match
    if (weightMap[leafType]) {
      return weightMap[leafType];
    }
    
    // Find best match for leaf type (case insensitive partial match)
    const lowerLeafType = leafType.toLowerCase();
    for (const [key, value] of Object.entries(weightMap)) {
      if (lowerLeafType.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerLeafType)) {
        return value;
      }
    }
    
    console.log(`ImpactService: No weight match found for '${leafType}', using default: 30g`);
    return 30; // Default average weight
  }

  // Get polyphenols content per leaf type (more accurate estimates based on research)
  private static getPolyphenolsPerLeaf(leafType: string): number {
    const polyphenolsMap: Record<string, number> = {
      // Exact detection class names
      'Onion Leaves': 140,
      'Garlic Leaves': 220,
      'Leek Leaves': 160,
      'Chive Leaves': 180,
      'Scallion Leaves': 150,
      'Shallot Leaves': 170,
      
      // Alternative names for flexibility
      'onion': 140,     // Onion leaves are rich in quercetin
      'garlic': 220,    // Garlic leaves have high allicin content
      'leek': 160,      // Leek leaves are good source of kaempferol
      'chive': 180,     // Chive leaves are rich in flavonoids
      'scallion': 150,  // Similar to onion
      'shallot': 170,   // Shallot leaves have good polyphenol content
      'wild garlic': 250, // Wild garlic has very high antioxidant content
      'ramp': 200,      // Ramps are nutrient-dense
      'green onion': 145, // Similar to scallion
      'carrot': 130,    // Carrot tops
      'beet': 190,      // Beet greens
      'radish': 110,    // Radish greens
      'turnip': 150,    // Turnip greens
      'parsley': 160,   // Parsley
      'cilantro': 140,  // Cilantro
      'mint': 220,      // Mint leaves
      'basil': 180,     // Basil leaves
      'thyme': 240,     // Thyme
      'oregano': 220,   // Oregano
      'sage': 200       // Sage
    };

    // First try exact match
    if (polyphenolsMap[leafType]) {
      return polyphenolsMap[leafType];
    }
    
    // Find best match for leaf type (case insensitive partial match)
    const lowerLeafType = leafType.toLowerCase();
    for (const [key, value] of Object.entries(polyphenolsMap)) {
      if (lowerLeafType.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerLeafType)) {
        return value;
      }
    }
    
    console.log(`ImpactService: No polyphenols match found for '${leafType}', using default: 160mg`);
    return 160; // Default average polyphenols content
  }

  // Get detected leaves data from storage with error handling
  // FIXED: Parse the actual detected leaves array structure from APIService
  private static getDetectedLeavesData(): Record<string, number> {
    try {
      // Use the same key format as APIService
      const data = localStorage.getItem('safeleafkitchen_detected_leaves');
      console.log('ImpactService: Raw localStorage data:', data);
      
      if (!data) {
        console.log('ImpactService: No detected leaves data found in localStorage');
        return {};
      }
      
      const parsed = JSON.parse(data);
      console.log('ImpactService: Parsed data:', parsed, 'Type:', typeof parsed, 'IsArray:', Array.isArray(parsed));
      
      // Handle the array format: [{timestamp, leaves: [{class: "Onion Leaves", ...}]}]
      if (Array.isArray(parsed)) {
        const leafCounts: Record<string, number> = {};
        
        parsed.forEach((detection: any, index: number) => {
          console.log(`ImpactService: Processing detection ${index}:`, detection);
          
          if (!detection || typeof detection !== 'object') {
            console.warn(`ImpactService: Invalid detection object at index ${index}:`, detection);
            return;
          }
          
          if (!detection.leaves || !Array.isArray(detection.leaves)) {
            console.warn(`ImpactService: No leaves array in detection ${index}:`, detection);
            return;
          }
          
          detection.leaves.forEach((leaf: any, leafIndex: number) => {
            if (!leaf || typeof leaf !== 'object') {
              console.warn(`ImpactService: Invalid leaf object at detection ${index}, leaf ${leafIndex}:`, leaf);
              return;
            }
            
            if (!leaf.class || typeof leaf.class !== 'string') {
              console.warn(`ImpactService: Invalid leaf class at detection ${index}, leaf ${leafIndex}:`, leaf.class);
              return;
            }
            
            const leafType = leaf.class.trim();
            if (leafType) {
              leafCounts[leafType] = (leafCounts[leafType] || 0) + 1;
              console.log(`ImpactService: Counted leaf: ${leafType}, new count: ${leafCounts[leafType]}`);
            }
          });
        });
        
        console.log('ImpactService: Final parsed leaf counts:', leafCounts);
        return leafCounts;
      }
      
      // Handle legacy object format: {"Onion Leaves": 1}
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        console.log('ImpactService: Processing legacy object format');
        const cleaned: Record<string, number> = {};
        
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof key === 'string' && key.trim()) {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue >= 0) {
              cleaned[key.trim()] = numValue;
              console.log(`ImpactService: Legacy format - ${key.trim()}: ${numValue}`);
            } else {
              console.warn(`ImpactService: Invalid value in legacy format for ${key}:`, value);
            }
          }
        });
        
        console.log('ImpactService: Final cleaned legacy data:', cleaned);
        return cleaned;
      }
      
      console.warn('ImpactService: Unrecognized data format:', parsed);
      return {};
    } catch (error) {
      console.error('ImpactService: Error parsing detected leaves data:', error);
      
      // Try to salvage any data that might be there
      try {
        const rawData = localStorage.getItem('safeleafkitchen_detected_leaves');
        console.log('ImpactService: Attempting to salvage data, raw:', rawData);
      } catch (salvageError) {
        console.error('ImpactService: Could not even access raw data:', salvageError);
      }
      
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

  // Validate impact metrics
  static validateMetrics(metrics: ImpactMetrics): boolean {
    return (
      typeof metrics.amount_g === 'number' && metrics.amount_g >= 0 &&
      typeof metrics.polyphenols_mg === 'number' && metrics.polyphenols_mg >= 0 &&
      typeof metrics.price_saved_MAD === 'number' && metrics.price_saved_MAD >= 0 &&
      typeof metrics.co2e_kg_avoided === 'number' && metrics.co2e_kg_avoided >= 0
    );
  }

  // Get weekly impact summary
  static getWeeklyImpact(): ImpactMetrics {
    // For now, return the same as cumulative impact
    // In the future, this could filter by date range
    return this.getCumulativeImpact();
  }

  // Get impact comparison (this week vs last week)
  static getImpactComparison(): { current: ImpactMetrics; previous: ImpactMetrics; change: number } {
    const current = this.getCumulativeImpact();
    // For demo purposes, simulate previous week data
    const previous = {
      ...current,
      amount_g: Math.max(0, current.amount_g * 0.7), // 30% less than current
      polyphenols_mg: Math.max(0, current.polyphenols_mg * 0.7),
      price_saved_MAD: Math.max(0, current.price_saved_MAD * 0.7),
      co2e_kg_avoided: Math.max(0, current.co2e_kg_avoided * 0.7)
    };
    
    const change = current.amount_g > 0 ? ((current.amount_g - previous.amount_g) / previous.amount_g) * 100 : 0;
    
    return { current, previous, change };
  }

  // Get environmental impact summary
  static getEnvironmentalImpact(): {
    co2_equivalent_km: number; // Equivalent car kilometers
    trees_equivalent: number;  // Equivalent trees planted
    water_bottles_saved: number; // Equivalent water bottles
  } {
    const impact = this.getCumulativeImpact();
    
    // 1 kg CO2 = ~4.6 km by car (average fuel consumption)
    const co2_equivalent_km = impact.co2e_kg_avoided * 4.6;
    
    // 1 tree absorbs ~22 kg CO2 per year, so we calculate equivalent trees
    const trees_equivalent = impact.co2e_kg_avoided / 22;
    
    // 1 liter of water saved = ~0.5 water bottles (500ml)
    const water_bottles_saved = impact.water_liters_saved * 0.5;
    
    return {
      co2_equivalent_km: Math.round(co2_equivalent_km * 10) / 10,
      trees_equivalent: Math.round(trees_equivalent * 100) / 100,
      water_bottles_saved: Math.round(water_bottles_saved * 10) / 10
    };
  }
}

export { ImpactService };
