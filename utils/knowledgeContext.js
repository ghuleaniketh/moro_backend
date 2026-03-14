const fs = require('fs');
const path = require('path');

// Load knowledge base
const knowledgePath = path.join(__dirname, '..', 'data', 'knowledge', 'nexttechlab.knowledge.json');
const ntlKnowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));

// Format knowledge for LLM context
const createKnowledgeContext = () => {
    const org = ntlKnowledge.organization;
    const structure = ntlKnowledge.structure;
    const history = ntlKnowledge.history;
    const membership = ntlKnowledge.membership;
    const university = ntlKnowledge.university;
    const state = ntlKnowledge.state;
    
    // Format labs with all details
    const labs = ntlKnowledge.labs.map(lab => {
        const projects = lab.projects.map(p => 
            `  * ${p.name} (${p.type}): ${p.description}`
        ).join('\n');
        
        return `${lab.name} (${lab.domain}):
- Syndicate Lead: ${lab.leadership.syndicate_lead}
- Focus Areas: ${lab.focus_areas.join(', ')}
- Projects:
${projects}
- Keywords: ${lab.keywords.join(', ')}`;
    }).join('\n\n');

    const achievements = ntlKnowledge.achievements_and_recognition.map(a => `- ${a}`).join('\n');
    const timeline = ntlKnowledge.history.timeline.map(t => `- ${t.year}: ${t.event}`).join('\n');
    const universityHighlights = university.highlights.map(h => `- ${h}`).join('\n');
    
    // Format state information
    const stateInfo = `
 Name: ${state.name}
Capital: ${state.capital_region}
Location: ${state.location}
Nickname: ${state.nickname}
Description: ${state.description}

Language: ${state.language.official} (Classical Language)

Cultural Identity: ${state.cultural_identity.traits.join(', ')}

Classical Arts:
- Dance: ${state.classical_arts.dance_forms.join(', ')}
- Music: ${state.classical_arts.music.join(', ')}
- Crafts: ${state.classical_arts.crafts_and_handlooms.join(', ')}

Festivals: ${state.festivals.join(', ')}

Cuisine: ${state.cuisine.style}
Famous Dishes: ${state.cuisine.famous_dishes.join(', ')}
Note: ${state.cuisine.notes}

Geography:
- Coastline: ${state.nature_and_geography.coastline}
- Rivers: ${state.nature_and_geography.major_rivers.join(', ')}
- Landscapes: ${state.nature_and_geography.landscapes.join(', ')}

Important Places: ${state.important_places.join(', ')}

Connection to University: ${state.connection_to_university.context}
Benefits: ${state.connection_to_university.benefits.join(', ')}`;

    return `You are Moro, an AI assistant built by students of Next Tech Lab AP.

STRICT RULES:
- You MUST answer ONLY using the knowledge provided below.
- DO NOT add external knowledge.
- DO NOT guess or hallucinate.
- If answer is not in the knowledge, say: "I'm sorry, I only have information about Next Tech Lab AP, SRM University-AP, and Andhra Pradesh."

KNOWLEDGE BASE:

=== ORGANIZATION ===
Name: ${org.name} (${org.short_name})
Type: ${org.type}
Location: ${org.location}
Mission: ${org.mission}
Description: ${org.description}

=== STRUCTURE ===
Model: ${structure.model}
Hierarchy: ${structure.hierarchy}
Departments Involved: ${structure.departments_involved}
Faculty in Charge: ${structure.faculty_in_charge ? 'Yes' : 'No'}
Approach: ${structure.approach}

=== HISTORY ===
Founded: ${history.founded_year}
Founders: ${history.founders.join(' and ')}
Inspiration: ${history.inspiration}

Timeline:
${timeline}

=== MEMBERSHIP ===
Total Members: ${membership.total_members}
Research Groups: ${membership.research_groups}

=== ACHIEVEMENTS & RECOGNITION ===
${achievements}

=== FOCUS DOMAINS ===
${ntlKnowledge.focus_domains.join(', ')}

=== ACTIVITIES ===
${ntlKnowledge.activities.join(', ')}

=== LABS ===
${labs}

=== UNIVERSITY ===
Name: ${university.name} (${university.full_name})
Location: ${university.location}
Type: ${university.type}
Description: ${university.description}

Highlights:
${universityHighlights}

=== ANDHRA PRADESH STATE ===
${stateInfo}

=== GLOBAL KEYWORDS ===
${ntlKnowledge.keywords_global.join(', ')}

Keep answers short (2–4 sentences).
Plain text only.`;
};

module.exports = { createKnowledgeContext, ntlKnowledge };
