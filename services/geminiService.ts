import { GoogleGenAI, Type } from "@google/genai";

// Utility to get the AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLocationAndFairness = async (location: string, price: number, size: number, renovation: number) => {
  const ai = getAI();
  const prompt = `
    Analysiere die folgende Immobilien-Investition in Österreich/Deutschland (Schwerpunkt Österreich wenn nicht anders angegeben).
    
    Standort: ${location}
    Kaufpreis: ${price} €
    Größe (geschätzt/optional): ${size > 0 ? size + ' m²' : 'Nicht angegeben'}
    Sanierungskosten: ${renovation} €
    
    Bitte gib mir eine kurze, knackige Einschätzung (max 150 Wörter):
    1. Wie ist die Makrolage und Mikrolage (falls bekannt)?
    2. Ist der Kaufpreis marktüblich, günstig oder teuer für diese Gegend?
    3. Welche Mietrendite ist in dieser Lage realistisch?
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Use search to get real-time location data
      }
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];
    
    return { text, sources };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Fehler bei der Analyse. Bitte überprüfen Sie den API Key.", sources: [] };
  }
};

export const analyzeFinancialDeepDive = async (
    financials: {
        purchasePrice: number,
        monthlyRent: number,
        monthlyRate: number,
        roi: number,
        location: string,
        equity: number
    }
) => {
    const ai = getAI();
    const prompt = `
        Agiere als strenger Immobilien-Investment-Analyst für den DACH-Raum (Fokus Österreich).
        Analysiere diese Finanzdaten im Detail:

        Standort: ${financials.location}
        Kaufpreis: ${financials.purchasePrice} €
        Monatsmiete: ${financials.monthlyRent} €
        Kreditrate: ${financials.monthlyRate.toFixed(2)} €
        Eigenkapital: ${financials.equity} €
        Errechneter ROI (Eigenkapitalrendite): ${financials.roi.toFixed(2)} %

        Bitte erstelle einen "Deep Dive" Bericht (Markdown) mit folgenden Punkten:
        
        1. **Nachhaltigkeit der Mietrendite**: Ist diese Miete (${financials.monthlyRent}€) für den Standort nachhaltig oder besteht Leerstandsrisiko?
        2. **Risiko-Check (Miete zu Kredit)**: Bewerte das Verhältnis Mieteinnahme zu Kreditrate (DSCR). Ist genügend Puffer für Instandhaltung da?
        3. **Steuerliche Grob-Einschätzung**: Erkläre kurz, wie sich die AfA (Abschreibung) hier auswirken könnte (Österreich: 1.5% pauschal vs Deutschland). *Hinweis: Keine Steuerberatung.*
        4. **Fazit**: Deal machen oder sein lassen?
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 2048 }, // Give it some thought for math/logic
            }
        });
        return response.text;
    } catch (error) {
        console.error("Deep Dive Error:", error);
        return "Detailanalyse konnte nicht erstellt werden.";
    }
};

export const generatePortfolioStrategy = async (goalCashflow: number, years: number, currentCapital: number, riskProfile: string, targetPropertyCount: number) => {
  const ai = getAI();
  const prompt = `
    Erstelle eine Immobilien-Investitionsstrategie für den DACH-Raum.
    
    Ziele:
    1. ${goalCashflow} € monatlicher Netto-Cashflow in ${years} Jahren.
    2. Portfolio-Größe: Ziel sind ca. ${targetPropertyCount} Immobilien (Einheiten).
    
    Startkapital: ${currentCapital} €.
    Risikoprofil: ${riskProfile}.
    
    Erstelle einen detaillierten Stufenplan (Markdown Format).
    
    WICHTIG: Berücksichtige in der Strategie nicht nur "Buy & Hold", sondern analysiere auch, ob und wann der VERKAUF von Immobilien sinnvoll ist:
    - Sollten Immobilien verkauft werden, um Eigenkapital für größere Deals freizusetzen (Asset Rotation)?
    - Ist Fix & Flip eine Option für dieses Risikoprofil?
    - Wann ist der Break-Even zwischen Halten und Verkaufen erreicht?
    
    Strukturiere die Antwort in Phasen (z.B. Aufbauphase, Konsolidierungsphase, Exit/Optimierungsphase).
    Rechne konservativ.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
         thinkingConfig: { thinkingBudget: 2048 },
      }
    });
    return response.text;
  } catch (error) {
    console.error("Strategy Error:", error);
    return "Strategie konnte nicht berechnet werden.";
  }
};

export const analyzeExternalLink = async (url: string) => {
  const ai = getAI();
  const prompt = `
    Besuche (via Google Search) die Immobilien-Listing-Seite oder suche nach Details zu dieser URL: ${url}
    
    Extrahiere folgende Daten im JSON Format:
    - kaufpreis (Number)
    - lage (String)
    - groesse (Number, m²)
    - miete_potenziell (Number, geschätzt)
    - bewertung (String, Kurze Analyse ob guter Deal)
    
    Falls du die URL nicht direkt lesen kannst, suche nach dem Titel oder Inhalt der URL in der Suche.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Link Analysis Error:", error);
    return null;
  }
};

export const searchMarket = async (query: string) => {
    const ai = getAI();
    const prompt = `Suche nach aktuellen Immobilienangeboten: "${query}". 
    Liste 5 relevante Angebote auf mit Titel, Preis, Ort und Link.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        const text = response.text;
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return { text, chunks };

    } catch (error) {
        console.error("Search Error", error);
        return { text: "Suche fehlgeschlagen.", chunks: [] };
    }
}
export const refineStrategy = async (originalStrategy: string, userQuestion: string) => {
    const ai = getAI();
    const prompt = `
      Du bist ein Immobilien-Experte.
      Hier ist die aktuelle Strategie, die du erstellt hast:
      "${originalStrategy}"
      
      Der Nutzer hat dazu folgende Frage oder Anmerkung:
      "${userQuestion}"
      
      Bitte antworte spezifisch auf diese Frage und passe ggf. Aspekte der Strategie in deiner Erklärung an.
      Bleibe beim "Du".
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Refinement Error:", error);
      return "Konnte die Frage nicht beantworten.";
    }
  };