# xml-ez

A TypeScript library for easy conversion between Zod schemas and XML/XSD. This library provides utilities to convert Zod schemas to XML Schema Definition (XSD) and parse XML documents into JavaScript objects.

## Installation

```bash
npm install xml-ez
```

## Features

- Convert Zod schemas to XML Schema (XSD)
- Parse XML strings into JavaScript objects
- Automatic handling of array structures
- Type-safe with full TypeScript support

## Usage

### Converting Zod Schema to XSD

```typescript
import { z } from 'zod';
import { zodToXmlSchema } from 'xml-ez';

// Define your Zod schema
const userSchema = z.object({
  name: z.string().describe('User\'s full name'),
  age: z.number().describe('User\'s age'),
  hobbies: z.array(z.string()).describe('List of hobbies')
});

// Convert to XSD
const xsd = zodToXmlSchema(userSchema, 'User');
console.log(xsd);
```

### Parsing XML to JavaScript Object

```typescript
import { parseXmlToObject } from 'xml-ez';

const xmlString = `
<?xml version="1.0" encoding="UTF-8"?>
<User>
  <name>John Doe</name>
  <age>30</age>
  <hobbies>
    <hobby>Reading</hobby>
    <hobby>Gaming</hobby>
  </hobbies>
</User>
`;

const result = parseXmlToObject(xmlString);
console.log(result);
// Output: { name: 'John Doe', age: 30, hobbies: ['Reading', 'Gaming'] }
```

## API Reference

### `zodToXmlSchema(zodSchema: z.ZodTypeAny, rootName?: string): string`

Converts a Zod schema to XML Schema (XSD).

- `zodSchema`: The Zod schema to convert
- `rootName`: Optional name for the root element (defaults to 'Root')
- Returns: XML Schema as a string

### `parseXmlToObject(xmlString: string): Record<string, any>`

Parses an XML string into a JavaScript object.

- `xmlString`: The XML string to parse
- Returns: A normalized JavaScript object

## License

MIT 