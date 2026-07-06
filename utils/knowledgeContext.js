const fs = require('fs');
const path = require('path');

// Load knowledge base
const knowledgePath = path.join(__dirname, '..', 'data', 'knowledge', 'nexttechlab.knowledge.json');
const ntlKnowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));

// Format knowledge for LLM context
const createKnowledgeContext = () => {
const org = ntlKnowledge.organization || {};
const structure = ntlKnowledge.structure || {};
const history = ntlKnowledge.history || {};
const membership = ntlKnowledge.membership || {};
const university = ntlKnowledge.university || {};
const state = ntlKnowledge.state || {};
    
    // Format labs with all details
    const labs = (ntlKnowledge.labs || []).map(lab => {
        const projects = (lab.projects || []).map(p => 
            `  * ${p.name} (${p.type}): ${p.description}`
        ).join('\n');
        
        return `${lab.name} (${lab.domain}):
- Focus Areas: ${(lab.focus_areas || []).join(', ')}
- Projects:
${projects || '  * No project details available.'}
- Keywords: ${(lab.keywords || []).join(', ')}`;
    }).join('\n\n');

    const achievements = (ntlKnowledge.achievements_and_recognition || []).map(a => `- ${a}`).join('\n') || '- No achievements available.';
    const timeline = (history.timeline || []).map(t => `- ${t.year}: ${t.event}`).join('\n') || '- No timeline available.';
    const universityHighlights = (Array.isArray(university.highlights) ? university.highlights : []).map(h => `- ${h}`).join('\n') || '- No university highlights available.';
    
    // Format state information
    const stateInfo = state.name ? `
 Name: ${state.name}
Capital: ${state.capital_region || 'N/A'}
Location: ${state.location || 'N/A'}
Nickname: ${state.nickname || 'N/A'}
Description: ${state.description || 'N/A'}

Language: ${state.language?.official || 'N/A'} (Classical Language)

Cultural Identity: ${(state.cultural_identity?.traits || []).join(', ') || 'N/A'}

Classical Arts:
- Dance: ${(state.classical_arts?.dance_forms || []).join(', ') || 'N/A'}
- Music: ${(state.classical_arts?.music || []).join(', ') || 'N/A'}
- Crafts: ${(state.classical_arts?.crafts_and_handlooms || []).join(', ') || 'N/A'}

Festivals: ${(state.festivals || []).join(', ') || 'N/A'}

Cuisine: ${state.cuisine?.style || 'N/A'}
Famous Dishes: ${(state.cuisine?.famous_dishes || []).join(', ') || 'N/A'}
Note: ${state.cuisine?.notes || 'N/A'}

Geography:
- Coastline: ${state.nature_and_geography?.coastline || 'N/A'}
- Rivers: ${(state.nature_and_geography?.major_rivers || []).join(', ') || 'N/A'}
- Landscapes: ${(state.nature_and_geography?.landscapes || []).join(', ') || 'N/A'}

Important Places: ${(state.important_places || []).join(', ') || 'N/A'}

Connection to University: ${state.connection_to_university?.context || 'N/A'}
Benefits: ${(state.connection_to_university?.benefits || []).join(', ') || 'N/A'}` : 'No Andhra Pradesh state details available in the knowledge base.';

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
