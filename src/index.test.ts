import { z } from 'zod';
import { zodToXmlSchema, parseXmlToObject } from './index';

describe('zodToXmlSchema', () => {
  it('should convert a simple object schema to XSD', () => {
    const schema = z.object({
      name: z.string().describe('User\'s name'),
      age: z.number().describe('User\'s age')
    });

    const xsd = zodToXmlSchema(schema, 'User');
    
    expect(xsd).toContain('<xs:schema');
    expect(xsd).toContain('name="User"');
    expect(xsd).toContain('type="xs:string"');
    expect(xsd).toContain('type="xs:double"');
    expect(xsd).toContain('User\'s name');
    expect(xsd).toContain('User\'s age');
  });

  it('should handle arrays correctly', () => {
    const schema = z.object({
      tags: z.array(z.string()).describe('List of tags')
    });

    const xsd = zodToXmlSchema(schema, 'Tags');
    
    expect(xsd).toContain('maxOccurs="unbounded"');
    expect(xsd).toContain('List of tags');
  });
});

describe('parseXmlToObject', () => {
  it('should parse simple XML to object', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <User>
        <name>John Doe</name>
        <age>30</age>
      </User>
    `;

    const result = parseXmlToObject(xml);
    
    expect(result).toEqual({
      name: 'John Doe',
      age: '30'
    });
  });

  it('should handle arrays correctly', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Root>
        <tags>
          <tag>typescript</tag>
          <tag>xml</tag>
          <tag>zod</tag>
        </tags>
      </Root>
    `;

    const result = parseXmlToObject(xml);
    
    expect(result.tags).toEqual(['typescript', 'xml', 'zod']);
  });
}); 