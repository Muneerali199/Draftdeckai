import { latexStyles } from '../latex-styles';

export function ModernMinimalTemplate({ data }: { data: any }) {
  return (
    <div style={{
      fontFamily: latexStyles.font.family,
      fontSize: latexStyles.font.sizeBase,
      lineHeight: latexStyles.font.lineHeight,
      color: latexStyles.font.color,
      textAlign: latexStyles.text.align,
      hyphens: latexStyles.text.hyphens,
    }}>
      {/* Minimalist Header */}
      <div style={{ marginBottom: '16pt', borderBottom: '0.4pt solid #000000', paddingBottom: '8pt' }}>
        <h1 style={{ ...latexStyles.name, textAlign: 'left' }}>
          {data.name}
        </h1>
        <div style={{ ...latexStyles.contact, marginTop: '4pt', textAlign: 'left' }}>
          {data.email && <span style={{ marginRight: '12pt' }}>{data.email}</span>}
          {data.phone && <span style={{ marginRight: '12pt' }}>{data.phone}</span>}
          {data.location && <span style={{ marginRight: '12pt' }}>{data.location}</span>}
          {data.linkedin && <span style={{ marginRight: '12pt' }}>{data.linkedin}</span>}
          {data.github && <span>{data.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: '12pt' }}>
          <p style={{
            ...latexStyles.paragraph,
            textAlign: 'justify',
            fontStyle: 'italic',
          }}>
            {data.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Experience
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
                    {' @ '}{exp.company}
                  </span>
                </div>
                <span style={latexStyles.date}>
                  {exp.date}
                </span>
              </div>
              <div style={{ fontSize: '11pt', marginBottom: '4pt' }}>
                {exp.location}
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

      {/* Skills */}
      {data.skills && Object.keys(data.skills).length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Skills
          </h2>
          <div style={{ lineHeight: 1.4 }}>
            {data.skills.programming && data.skills.programming.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                {data.skills.programming.join(' • ')}
              </div>
            )}
            {data.skills.technical && data.skills.technical.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                {data.skills.technical.join(' • ')}
              </div>
            )}
            {data.skills.tools && data.skills.tools.length > 0 && (
              <div style={{ marginBottom: '4pt' }}>
                {data.skills.tools.join(' • ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects */}
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
                  {proj.technologies.join(' • ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <h2 style={latexStyles.section}>
            Certifications
          </h2>
          {data.certifications.map((cert: any, i: number) => (
            <div key={i} style={{ marginTop: i > 0 ? '4pt' : 0 }}>
              {cert.name} • {cert.issuer} • {cert.date}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
