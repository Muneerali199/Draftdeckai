import { latexStyles } from '../latex-styles';

export function CompactTemplate({ data }: { data: any }) {
  // Compact-specific styles - smaller spacing for dense content
  const compactSection = {
    ...latexStyles.section,
    fontSize: '12pt',
    marginTop: '8pt',
    marginBottom: '4pt',
  };

  return (
    <div style={{
      fontFamily: latexStyles.font.family,
      fontSize: latexStyles.font.sizeBase,
      lineHeight: latexStyles.font.lineHeight,
      color: latexStyles.font.color,
      textAlign: latexStyles.text.align,
      hyphens: latexStyles.text.hyphens,
    }}>
      {/* Compact Header */}
      <div style={{ marginBottom: '10pt', paddingBottom: '6pt', borderBottom: '0.4pt solid #000000' }}>
        <h1 style={{ ...latexStyles.name, fontSize: '15pt' }}>
          {data.name}
        </h1>
        <div style={{ ...latexStyles.contact, marginTop: '2pt' }}>
          {data.email} | {data.phone} | {data.location}
          {data.linkedin && ` | ${data.linkedin}`}
          {data.github && ` | ${data.github}`}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div>
          <h2 style={compactSection}>
            Summary
          </h2>
          <p style={{
            ...latexStyles.paragraph,
            textAlign: 'justify',
          }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Skills */}
      {data.skills && Object.keys(data.skills).length > 0 && (
        <div>
          <h2 style={compactSection}>
            Skills
          </h2>
          <div style={{ lineHeight: 1.2 }}>
            {data.skills.programming && data.skills.programming.length > 0 && (
              <div style={{ marginBottom: '3pt' }}>
                <span style={{ fontWeight: 'bold' }}>Languages: </span>
                {data.skills.programming.join(', ')}
              </div>
            )}
            {data.skills.technical && data.skills.technical.length > 0 && (
              <div style={{ marginBottom: '3pt' }}>
                <span style={{ fontWeight: 'bold' }}>Technologies: </span>
                {data.skills.technical.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div>
          <h2 style={compactSection}>
            Experience
          </h2>
          {data.experience.map((exp: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? '6pt' : 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div>
                  <span style={latexStyles.jobTitle}>
                    {exp.title}
                  </span>
                  <span style={latexStyles.company}>
                    {' | '}{exp.company}
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
          <h2 style={compactSection}>
            Education
          </h2>
          {data.education.map((edu: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? '4pt' : 0, lineHeight: 1.2 }}>
              <span style={latexStyles.jobTitle}>{edu.degree}</span>
              <span style={latexStyles.company}>{', '}{edu.institution || edu.school}</span>
              <span>{', '}{edu.date}</span>
              {edu.gpa && <span>{' | GPA: '}{edu.gpa}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 style={compactSection}>
            Projects
          </h2>
          {data.projects.map((proj: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? '6pt' : 0 }}>
              <div style={latexStyles.subsection}>
                {proj.name}
              </div>
              <p style={{ ...latexStyles.paragraph, textAlign: 'justify' }}>
                {proj.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <h2 style={compactSection}>
            Certifications
          </h2>
          {data.certifications.map((cert: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? '3pt' : 0, lineHeight: 1.2 }}>
              {cert.name} | {cert.issuer} | {cert.date}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
