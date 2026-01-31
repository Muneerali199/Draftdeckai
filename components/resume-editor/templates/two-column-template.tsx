import { latexStyles } from '../latex-styles';

export function TwoColumnTemplate({ data }: { data: any }) {
  // Two-column specific styles with LaTeX fonts
  const leftColumnStyle = {
    width: '35%',
    borderRight: '0.4pt solid #000000',
    paddingRight: '12pt',
    fontFamily: latexStyles.font.family,
    fontSize: latexStyles.font.sizeBase,
    lineHeight: latexStyles.font.lineHeight,
    color: latexStyles.font.color,
  };

  const rightColumnStyle = {
    width: '65%',
    paddingLeft: '12pt',
    fontFamily: latexStyles.font.family,
    fontSize: latexStyles.font.sizeBase,
    lineHeight: latexStyles.font.lineHeight,
    color: latexStyles.font.color,
  };

  const sectionStyle = {
    ...latexStyles.section,
    fontSize: '12pt',
    marginTop: '10pt',
    marginBottom: '4pt',
  };

  return (
    <div style={{
      display: 'flex',
      gap: '0',
      fontFamily: latexStyles.font.family,
      fontSize: latexStyles.font.sizeBase,
      lineHeight: latexStyles.font.lineHeight,
      color: latexStyles.font.color,
    }}>
      {/* Left Column - 35% */}
      <div style={leftColumnStyle}>
        {/* Name */}
        <div style={{ marginBottom: '12pt' }}>
          <h1 style={{
            ...latexStyles.name,
            fontSize: '14pt',
            lineHeight: 1.1,
          }}>
            {data.name}
          </h1>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: '12pt' }}>
          <h2 style={sectionStyle}>
            Contact
          </h2>
          <div style={{ lineHeight: 1.4 }}>
            {data.email && <div style={{ marginBottom: '2pt', wordBreak: 'break-all' }}>{data.email}</div>}
            {data.phone && <div style={{ marginBottom: '2pt' }}>{data.phone}</div>}
            {data.location && <div style={{ marginBottom: '2pt' }}>{data.location}</div>}
            {data.linkedin && <div style={{ marginBottom: '2pt', wordBreak: 'break-all' }}>{data.linkedin}</div>}
            {data.github && <div style={{ wordBreak: 'break-all' }}>{data.github}</div>}
          </div>
        </div>

        {/* Skills */}
        {data.skills && Object.keys(data.skills).length > 0 && (
          <div style={{ marginBottom: '12pt' }}>
            <h2 style={sectionStyle}>
              Skills
            </h2>
            <div>
              {data.skills.programming && data.skills.programming.length > 0 && (
                <div style={{ marginBottom: '6pt' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>Languages</div>
                  {data.skills.programming.map((skill: string, i: number) => (
                    <div key={i} style={{ paddingLeft: '8pt' }}>• {skill}</div>
                  ))}
                </div>
              )}
              {data.skills.technical && data.skills.technical.length > 0 && (
                <div style={{ marginBottom: '6pt' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>Technical</div>
                  {data.skills.technical.map((skill: string, i: number) => (
                    <div key={i} style={{ paddingLeft: '8pt' }}>• {skill}</div>
                  ))}
                </div>
              )}
              {data.skills.tools && data.skills.tools.length > 0 && (
                <div style={{ marginBottom: '6pt' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>Tools</div>
                  {data.skills.tools.map((skill: string, i: number) => (
                    <div key={i} style={{ paddingLeft: '8pt' }}>• {skill}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div style={{ marginBottom: '12pt' }}>
            <h2 style={sectionStyle}>
              Education
            </h2>
            {data.education.map((edu: any, i: number) => (
              <div key={i} style={{ marginBottom: '8pt' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>{edu.degree}</div>
                <div style={{ fontStyle: 'italic', marginBottom: '2pt' }}>{edu.institution || edu.school}</div>
                <div>{edu.date}</div>
                {edu.gpa && <div>GPA: {edu.gpa}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div>
            <h2 style={sectionStyle}>
              Certifications
            </h2>
            {data.certifications.map((cert: any, i: number) => (
              <div key={i} style={{ marginBottom: '6pt' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2pt' }}>{cert.name}</div>
                <div style={{ fontStyle: 'italic' }}>{cert.issuer}, {cert.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column - 65% */}
      <div style={rightColumnStyle}>
        {/* Summary */}
        {data.summary && (
          <div style={{ marginBottom: '12pt' }}>
            <h2 style={sectionStyle}>
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

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div style={{ marginBottom: '12pt' }}>
            <h2 style={sectionStyle}>
              Work Experience
            </h2>
            {data.experience.map((exp: any, i: number) => (
              <div key={i} style={{ marginTop: i > 0 ? '8pt' : 0 }}>
                <div style={{ marginBottom: '2pt' }}>
                  <span style={latexStyles.jobTitle}>
                    {exp.title}
                  </span>
                </div>
                <div style={{ fontStyle: 'italic', marginBottom: '2pt' }}>
                  {exp.company} | {exp.location} | {exp.date}
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

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div>
            <h2 style={sectionStyle}>
              Key Projects
            </h2>
            {data.projects.map((proj: any, i: number) => (
              <div key={i} style={{ marginTop: i > 0 ? '8pt' : 0 }}>
                <div style={latexStyles.subsection}>
                  {proj.name}
                </div>
                <p style={{ ...latexStyles.paragraph, textAlign: 'justify' }}>
                  {proj.description}
                </p>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p style={{ marginTop: '2pt', fontStyle: 'italic' }}>
                    Technologies: {proj.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
