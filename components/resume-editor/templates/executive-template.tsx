import { latexStyles } from '../latex-styles';

export function ExecutiveTemplate({ data }: { data: any }) {
  return (
    <div style={{
      fontFamily: latexStyles.font.family,
      fontSize: latexStyles.font.sizeBase,
      lineHeight: latexStyles.font.lineHeight,
      color: latexStyles.font.color,
      textAlign: latexStyles.text.align,
      hyphens: latexStyles.text.hyphens,
    }}>
      {/* Executive Header */}
      <div style={latexStyles.header}>
        <h1 style={latexStyles.name}>
          {data.name}
        </h1>
        <div style={latexStyles.contact}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span> | {data.phone}</span>}
          {data.location && <span> | {data.location}</span>}
        </div>
        {(data.linkedin || data.github) && (
          <div style={{ ...latexStyles.contact, marginTop: '2pt' }}>
            {data.linkedin && <span>{data.linkedin}</span>}
            {data.github && <span> | {data.github}</span>}
          </div>
        )}
      </div>

      {/* Executive Summary */}
      {data.summary && (
        <div>
          <h2 style={latexStyles.section}>
            Executive Summary
          </h2>
          <p style={{
            ...latexStyles.paragraph,
            textAlign: 'justify',
          }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Professional Experience */}
      {data.experience && data.experience.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Professional Experience
          </h2>
          {data.experience.map((exp: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? latexStyles.subsection.marginTop : 0 }}>
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

      {/* Education */}
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
                    {', '}{edu.institution || edu.school}
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

      {/* Core Competencies */}
      {data.skills && Object.keys(data.skills).length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Core Competencies
          </h2>
          <div style={{ lineHeight: 1.2 }}>
            {data.skills.programming && data.skills.programming.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <span style={latexStyles.jobTitle}>Languages: </span>
                <span>{data.skills.programming.join(' • ')}</span>
              </div>
            )}
            {data.skills.technical && data.skills.technical.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <span style={latexStyles.jobTitle}>Technical: </span>
                <span>{data.skills.technical.join(' • ')}</span>
              </div>
            )}
            {data.skills.tools && data.skills.tools.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                <span style={latexStyles.jobTitle}>Tools: </span>
                <span>{data.skills.tools.join(' • ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notable Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Notable Projects
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
                  <span>{proj.technologies.join(' • ')}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Professional Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Professional Certifications
          </h2>
          {data.certifications.map((cert: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? '4pt' : 0 }}>
              <span style={latexStyles.jobTitle}>{cert.name}</span>
              {cert.issuer && <span style={latexStyles.company}>, {cert.issuer}</span>}
              <span>, {cert.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
