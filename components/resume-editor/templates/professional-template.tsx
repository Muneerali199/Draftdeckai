import { latexStyles } from '../latex-styles';

export function ProfessionalTemplate({ data }: { data: any }) {
  return (
    <div style={{
      fontFamily: latexStyles.font.family,
      fontSize: latexStyles.font.sizeBase,
      lineHeight: latexStyles.font.lineHeight,
      color: latexStyles.font.color,
      textAlign: latexStyles.text.align,
      hyphens: latexStyles.text.hyphens,
    }}>
      {/* Header - Center Environment */}
      <div style={latexStyles.header}>
        <h1 style={latexStyles.name}>
          {data.name}
        </h1>
        <div style={latexStyles.contact}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span> | {data.phone}</span>}
          {data.location && <span> | {data.location}</span>}
          {data.linkedin && <span> | {data.linkedin}</span>}
          {data.github && <span> | {data.github}</span>}
        </div>
      </div>

      {/* Professional Summary Section */}
      {data.summary && (
        <div>
          <h2 style={latexStyles.section}>
            Professional Summary
          </h2>
          <p style={{
            ...latexStyles.paragraph,
            textAlign: 'justify',
          }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Work Experience Section */}
      {data.experience && data.experience.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Work Experience
          </h2>
          {data.experience.map((exp: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? latexStyles.subsection.marginTop : 0 }}>
              {/* Job header: Title | Company, Location  Date */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2pt',
              }}>
                <div>
                  <span style={latexStyles.jobTitle}>
                    {exp.title}
                  </span>
                  <span style={latexStyles.company}>
                    {' | '}{exp.company}{exp.location && `, ${exp.location}`}
                  </span>
                </div>
                <span style={latexStyles.date}>
                  {exp.date}
                </span>
              </div>

              {/* Bullet points - LaTeX itemize style */}
              {exp.description && exp.description.length > 0 && (
                <ul style={latexStyles.bulletList}>
                  {exp.description.map((desc: string, j: number) => (
                    <li key={j} style={latexStyles.bulletItem}>
                      <span style={latexStyles.bulletMarker}>•</span>
                      {desc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education Section */}
      {data.education && data.education.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Education
          </h2>
          {data.education.map((edu: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? latexStyles.subsection.marginTop : 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div>
                  <span style={latexStyles.jobTitle}>
                    {edu.degree}
                  </span>
                  <span style={latexStyles.company}>
                    {', '}{edu.institution || edu.school}{edu.location && `, ${edu.location}`}
                  </span>
                </div>
                <span style={latexStyles.date}>
                  {edu.date}
                </span>
              </div>
              {edu.gpa && (
                <p style={{ marginTop: '2pt', lineHeight: 1.2 }}>
                  GPA: {edu.gpa}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills Section */}
      {data.skills && Object.keys(data.skills).length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Technical Skills
          </h2>
          <div style={{ lineHeight: 1.2 }}>
            {data.skills.programming && data.skills.programming.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <span style={latexStyles.jobTitle}>Languages: </span>
                <span>{data.skills.programming.join(', ')}</span>
              </div>
            )}
            {data.skills.technical && data.skills.technical.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <span style={latexStyles.jobTitle}>Technical: </span>
                <span>{data.skills.technical.join(', ')}</span>
              </div>
            )}
            {data.skills.tools && data.skills.tools.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <span style={latexStyles.jobTitle}>Tools: </span>
                <span>{data.skills.tools.join(', ')}</span>
              </div>
            )}
            {data.skills.soft && data.skills.soft.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <span style={latexStyles.jobTitle}>Soft Skills: </span>
                <span>{data.skills.soft.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects Section */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Projects
          </h2>
          {data.projects.map((proj: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? latexStyles.subsection.marginTop : 0 }}>
              <div style={latexStyles.subsection}>
                {proj.name}
              </div>
              <p style={{ ...latexStyles.paragraph, textAlign: 'justify' }}>
                {proj.description}
              </p>
              {proj.technologies && proj.technologies.length > 0 && (
                <p style={{ marginTop: '2pt', lineHeight: 1.2 }}>
                  <span style={latexStyles.company}>Technologies: </span>
                  <span>{proj.technologies.join(', ')}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications Section */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Certifications
          </h2>
          {data.certifications.map((cert: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? '4pt' : 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <span style={latexStyles.jobTitle}>
                  {cert.name}
                </span>
                <span style={{ fontSize: '11pt', lineHeight: 1.2 }}>
                  {cert.date}
                </span>
              </div>
              {cert.issuer && (
                <span style={latexStyles.company}>
                  {cert.issuer}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
