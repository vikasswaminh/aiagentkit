import { ResumeData } from "@/lib/schemas/resume";

export function generateLaTeX(data: ResumeData): string {
    const sanitize = (str: string | null) => str ? str.replace(/([&%$#_{}~^\\])/g, "\\$1") : "";

    return `\\documentclass[a4paper,10pt]{article}
\\usepackage[left=0.75in,top=0.6in,right=0.75in,bottom=0.6in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage[T1]{fontenc}
\\usepackage{charter}

\\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,      
    urlcolor=blue,
}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}

\\begin{document}

\\begin{center}
    {\\Huge \\textbf{${sanitize(data.basics.name)}}} \\\\ \\vspace{2pt}
    ${sanitize(data.basics.location)} $|$ ${sanitize(data.basics.phone)} $|$ \\href{mailto:${data.basics.email}}{${sanitize(data.basics.email)}}
\\end{center}

\\section{Education}
${data.education.map(edu => `
\\textbf{${sanitize(edu.institution)}} \\hfill \\textbf{${sanitize(edu.startDate)} --- ${sanitize(edu.endDate || "Present")}} \\\\
\\textit{${sanitize(edu.degree)}}
`).join("\n")}

${data.experience.length > 0 ? `
\\section{Experience}
${data.experience.map(exp => `
\\textbf{${sanitize(exp.company)}} \\hfill \\textbf{${sanitize(exp.startDate)} --- ${sanitize(exp.endDate || "Present")}} \\\\
\\textit{${sanitize(exp.role)}}
\\begin{itemize}[noitemsep,topsep=0pt,leftmargin=1.5em]
    ${exp.bullets.map(bullet => `\\item ${sanitize(bullet)}`).join("\n    ")}
\\end{itemize}
`).join("\n")}
` : ""}

${data.projects.length > 0 ? `
\\section{Projects}
${data.projects.map(proj => `
\\textbf{${sanitize(proj.name)}} \\\\
\\textit{${sanitize(proj.description)}}
`).join("\n")}
` : ""}

${data.skills.length > 0 ? `
\\section{Technical Skills}
\\begin{itemize}[noitemsep,topsep=0pt,leftmargin=1.5em]
    \\item ${data.skills.map(skill => sanitize(skill)).join(", ")}
\\end{itemize}
` : ""}

${data.achievements && data.achievements.length > 0 ? `
\\section{Achievements}
\\begin{itemize}[noitemsep,topsep=0pt,leftmargin=1.5em]
    ${data.achievements.map(ach => `\\item ${sanitize(ach)}`).join("\n    ")}
\\end{itemize}
` : ""}

${data.certifications && data.certifications.length > 0 ? `
\\section{Certifications}
\\begin{itemize}[noitemsep,topsep=0pt,leftmargin=1.5em]
    ${data.certifications.map(cert => `\\item ${sanitize(cert)}`).join("\n    ")}
\\end{itemize}
` : ""}

\\end{document}
`;
}
