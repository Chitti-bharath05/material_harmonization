Problem Statemment :
       AI-Driven Standardization and Harmonization of Material Codes Across CPSEs.
Description:
      Background Central Public Sector Enterprises (CPSEs) operating in sectors such as Oil & Gas, Power, Steel, Mining and Heavy Engineering procure and maintain a large number of similar or functionally equivalent materials. However, the same material may be assigned different material codes, descriptions, specifications, units of measurement and classification across different CPSEs.

This results in duplication of material masters, inconsistent descriptions, difficulty in identifying equivalent materials, fragmented procurement data, higher inventory levels and limited opportunities for collaborative procurement.

A unified and intelligent approach is therefore required to standardize, harmonize and rationalize material master data across CPSEs.

• Description The proposed solution envisages development of an AI-powered National Unified Material Master Framework capable of analysing material codes, descriptions, specifications, technical parameters and historical procurement data from multiple CPSEs.

The system shall use Artificial Intelligence, Machine Learning and Natural Language Processing (NLP) techniques to identify identical, duplicate, near-duplicate and functionally equivalent materials across different ERP/SAP systems.

The platform should automatically recommend standardized material descriptions, specifications, classifications and a Common National Material Code, while retaining mapping with the respective CPSE's existing material codes.

The system should provide intelligent matching and recommendation capabilities, allowing users to review, validate and approve proposed mappings. It should also support migration/mapping of legacy material codes and seamless integration with existing SAP/ERP systems.

• Expected Solution An AI-driven Unified Material Master Platform shall be developed with the following capabilities:
• AI-based matching of material descriptions and specifications across CPSEs.
• Identification of duplicate, near-duplicate and equivalent materials.
• Automated standardization of material descriptions and technical attributes.
• Intelligent classification and categorization of materials.
• Generation/recommendation of a Common National Material Code.
• Mapping of existing CPSE material codes to the common national code.
• Legacy material code rationalization and migration support.
• User validation and approval workflow for AI recommendations.
• Dashboard for material master analytics and duplicate detection.
• Audit trail and governance mechanism for material master changes.
• Integration capability with SAP/ERP systems of participating CPSEs.

The proposed solution should enable 'One Nation â€“ One Material Code' for common materials, while maintaining traceability to individual CPSE material codes.

• Key Capabilities 1. AI Material Matching & Recommendation 2. Material Standardization & Classification 3. Duplicate / Near-Duplicate Detection 4. Common National Material Code Generation 5. CPSE Code Mapping & Migration Support 6. Material Master Dashboard & Analytics 7. Audit Trail & Governance 8. SAP / ERP Integration
• Expected Impact
• One Nation â€“ One Common Material Code
• Reduction in duplicate and redundant material codes
• Improved material master data quality
• Better inventory optimization and visibility
• Reduced procurement cost through demand aggregation
• Improved inter-CPSE material identification and collaboration
• Faster procurement and specification finalization
• Better data-driven procurement decisions
• Foundation for common procurement and strategic sourcing across CPSEs
Here's the consolidated, final tech stack — pulling together everything we corrected and refined across the conversation into one clean reference.

Frontend
Component	Technology
UI Framework	React.js + Tailwind CSS
API Client	REST / GraphQL client (Axios or built-in fetch)
Backend
Component	Technology
Core application	Python + Django (auth, roles, admin, workflow, audit trail)
ML/AI service	Python + FastAPI (separate microservice, kept independent so it scales apart from the main app)
Background jobs	Celery + Redis (for long-running matching jobs, doesn't block requests)
Database
Component	Technology
Primary store	PostgreSQL
Vector search	pgvector extension on PostgreSQL (no separate vector DB needed unless scale demands it)
AI / ML
Component	Technology
Text normalization	Custom domain dictionary (rule-based: SS→Stainless Steel, Gr→Grade, etc.)
Attribute extraction	spaCy / regex-based NLP
Semantic matching	Sentence-Transformers (e.g., all-MiniLM-L6-v2) for embeddings
Classification/tagging	Scikit-learn (for categorizing materials into taxonomy, not for semantic matching)
Similarity search	Cosine similarity via pgvector nearest-neighbour queries
Integration
Component	Technology
ERP connectivity	SAP OData services / pyrfc (RFC calls), fronted by a REST gateway
Cloud & Infrastructure
Component	Technology
Hosting (prototype/demo)	AWS or Azure
Hosting (production target)	Government cloud — MeghRaj / NIC (for data sovereignty/compliance)
Containerization	Docker (+ Docker Compose for local dev)
DevOps & Tooling
Component	Technology
Version control	Git / GitHub
CI/CD	GitHub Actions or Jenkins
Dev environment	Google Antigravity (agentic IDE, Gemini-powered)