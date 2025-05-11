import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { XMLParser } from 'fast-xml-parser';

// Types for JSON Schema (simplified)
interface JSONSchema {
    type?: string | string[];
    description?: string;
    properties?: { [key: string]: JSONSchema };
    items?: JSONSchema | JSONSchema[];
    required?: string[];
    minItems?: number;
    maxItems?: number;
}

/**
 * Convert a Zod schema to XML Schema (XSD).
 * @param zodSchema - The Zod schema to convert
 * @param rootName - The name of the root element in the XML Schema
 * @returns XML Schema as a string
 */
export function zodToXmlSchema(zodSchema: z.ZodTypeAny, rootName = 'Root'): string {
    const jsonSchema = zodToJsonSchema(zodSchema);
    return jsonSchemaToXsd(jsonSchema, rootName);
}

/**
 * Parse an XML string into a JS object.
 * @param xmlString - The XML string to parse
 * @returns A normalized JavaScript object
 */
export function parseXmlToObject(xmlString: string): Record<string, any> {
    const parser = new XMLParser();
    return normalizeParsedObject(parser.parse(xmlString));
}

/**
 * Converts JSON Schema to XSD.
 */
function jsonSchemaToXsd(schema: JSONSchema, rootName: string): string {
    const xsdHeader = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           elementFormDefault="qualified"
           attributeFormDefault="unqualified">`;

    const xsdBody = convertSchema(schema, rootName);
    const xsdFooter = `</xs:schema>`;
    return `${xsdHeader}\n${xsdBody}\n${xsdFooter}`;
}

function convertSchema(schema: JSONSchema, elementName: string): string {
    let type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

    switch (type) {
        case 'object':
            return convertObject(schema, elementName);
        case 'array':
            return convertArray(schema, elementName);
        case 'string':
        case 'number':
        case 'integer':
        case 'boolean':
            return wrapWithAnnotations(
                `<xs:element name="${elementName}" type="${getXsdTypeForJsonType(type)}"/>`,
                schema.description
            );
        default:
            return wrapWithAnnotations(`<xs:element name="${elementName}" type="xs:string"/>`, schema.description);
    }
}

function getXsdTypeForJsonType(type?: string): string {
    switch (type) {
        case 'string': return 'xs:string';
        case 'number': return 'xs:double';
        case 'integer': return 'xs:int';
        case 'boolean': return 'xs:boolean';
        default: return 'xs:string';
    }
}

function convertObject(schema: JSONSchema, elementName: string): string {
    const props = schema.properties || {};
    const elements = Object.keys(props).map(propName => convertSchema(props[propName], propName)).join("\n");

    const content = `
<xs:element name="${elementName}">
  ${annotationTag(schema.description)}
  <xs:complexType>
    <xs:sequence>
      ${elements}
    </xs:sequence>
  </xs:complexType>
</xs:element>`.trim();

    return content;
}

function convertArray(schema: JSONSchema, elementName: string): string {
    const itemsSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
    if (!itemsSchema) {
        return wrapWithAnnotations(
            `<xs:element name="${elementName}" type="xs:string" minOccurs="0" maxOccurs="unbounded"/>`,
            schema.description
        );
    }

    const minOccurs = schema.minItems !== undefined ? schema.minItems.toString() : "0";
    const maxOccurs = schema.maxItems !== undefined ? schema.maxItems.toString() : "unbounded";

    const itemTypeElement = convertSchema(itemsSchema, elementName);

    const modifiedItem = itemTypeElement.replace(
        /<xs:element([^>]*)>/,
        `<xs:element$1 minOccurs="${minOccurs}" maxOccurs="${maxOccurs}">`
    );

//     const content = `
// <xs:element name="${elementName}">
//   ${annotationTag(schema.description)}
//   <xs:complexType>
//     <xs:sequence>
//       ${modifiedItem}
//     </xs:sequence>
//   </xs:complexType>
// </xs:element>`.trim();

    return modifiedItem;
}

function annotationTag(description?: string): string {
    if (!description) return '';
    return `
  <xs:annotation>
    <xs:documentation>${escapeXml(description)}</xs:documentation>
  </xs:annotation>`.trim();
}

function wrapWithAnnotations(elementStr: string, description?: string): string {
    if (!description) return elementStr;
    const annotation = annotationTag(description);
    const replaced = elementStr.replace(/(<xs:element[^>]*)>/, `$1>\n  ${annotation}\n`);
    return replaced !== elementStr ? replaced : `${annotation}\n${elementStr}`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function normalizeParsedObject(parsedObj: any): any {
    if ('?xml' in parsedObj) {
        delete parsedObj['?xml'];
    }

    Object.entries(parsedObj.root as Record<string, unknown> || {}).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
            const singularKey = key.endsWith('s') ? key.slice(0, -1) : key;
            const objValue = value as Record<string, unknown>;
            if (objValue[singularKey] && Array.isArray(objValue[singularKey])) {
                (parsedObj.root as Record<string, unknown>)[key] = objValue[singularKey];
            }
        }
    });

    return parsedObj.root ? parsedObj.root : parsedObj;
} 