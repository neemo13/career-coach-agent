"""
WHAT  - Tool 1 for the career agent: compares resume text against a job
        description and returns a structured skill-fit analysis.
WHY   - this is the exact Phase 4 Gemini call, extracted into a standalone
        tool with a clear input/output contract the agent can call by name.
        Behavior is unchanged from Phase 4.
HOW   - called by app/agents/career_agent.py.
"""

from app.core.llm_provider import get_llm_provider, generate_structured_with_retry
from app.schemas.analysis import GeminiAnalysisResult

SKILL_MATCHING_PROMPT_TEMPLATE = """You are a career coach analyzing how well a candidate's resume fits a job description.

Compare the resume and job description below and respond with ONLY the requested structured data.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_text}

Identify:
- matching_skills: skills/experience in the resume that match the job requirements
- missing_skills: skills/requirements the job asks for that are not evident in the resume
- strengths: the candidate's strongest points for this specific role
- weaknesses: gaps or weak areas relative to this specific role
- recommendations: concrete, actionable steps to improve fit for this role
- summary: a short (2-4 sentence) plain-language overview of the overall fit
"""


def run_skill_matching(resume_text: str, job_text: str) -> GeminiAnalysisResult:
    provider = get_llm_provider()
    prompt = SKILL_MATCHING_PROMPT_TEMPLATE.format(resume_text=resume_text, job_text=job_text)
    return generate_structured_with_retry(provider, prompt, GeminiAnalysisResult)