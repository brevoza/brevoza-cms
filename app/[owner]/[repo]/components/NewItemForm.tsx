"use client";

import { useState } from "react";

type SchemaProperty = {
  type: string;
  description?: string;
};

type CollectionSchema = {
  schema?: {
    properties?: Record<string, SchemaProperty>;
    required?: string[];
  };
  storage?: {
    path?: string;
    format?: string;
    idField?: string;
  };
};

export default function NewItemForm({ 
  collectionConfig, 
  collectionName,
  owner,
  repo
}: { 
  collectionConfig: string; 
  collectionName: string;
  owner: string;
  repo: string;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prNumber, setPrNumber] = useState<number | null>(null);
  
  // Parse the collection config YAML to extract schema
  const parsedConfig = parseCollectionConfig(collectionConfig);
  const properties = parsedConfig.schema?.properties || {};
  const storagePath = parsedConfig.storage?.path || `${collectionName}/`;
  const format = parsedConfig.storage?.format || 'json';
  const idField = parsedConfig.storage?.idField || 'id';

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleCreateProposal = async () => {
    setError(null);
    setPrUrl(null);
    setPrNumber(null);
    setIsSubmitting(true);
    
    try {
      // Determine the file path based on the idField
      const itemId = formData[idField] || 'new-item';
      const fileExtension = format === 'json' ? '.json' : '.yml';
      const itemPath = `${storagePath}${itemId}${fileExtension}`;
      
      console.log('Form Data (JSON):', JSON.stringify(formData, null, 2));
      console.log('Target Path:', itemPath);

      // Call the API to create the PR
      const response = await fetch('/api/create-item-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          collectionName,
          itemData: formData,
          itemPath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create proposal');
      }

      setPrUrl(data.url);
      setPrNumber(data.number);
      
      // Clear the form
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error creating proposal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="text-md font-medium mb-4">Create New Item</h4>
      
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {prUrl && prNumber && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Success!</strong> Pull request #{prNumber} created. An admin will need to approve your proposal before you see the change reflected above.
            </div>
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-solid border-green-600 bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
            >
              Open PR on GitHub
            </a>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        {Object.entries(properties).map(([fieldName, fieldSchema]) => (
          <div key={fieldName} className="flex flex-col gap-1">
            <label 
              htmlFor={fieldName} 
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {fieldName}
              {fieldSchema.description && (
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  ({fieldSchema.description})
                </span>
              )}
            </label>
            
            {fieldSchema.type === 'markdown' || fieldSchema.type === 'string' || fieldSchema.type === 'image' ? (
              fieldSchema.type === 'markdown' ? (
                <textarea
                  id={fieldName}
                  value={formData[fieldName] || ''}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[100px]"
                  placeholder={`Enter ${fieldName}`}
                />
              ) : (
                <input
                  type="text"
                  id={fieldName}
                  value={formData[fieldName] || ''}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder={`Enter ${fieldName}`}
                />
              )
            ) : fieldSchema.type === 'date' ? (
              <input
                type="date"
                id={fieldName}
                value={formData[fieldName] || ''}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <input
                type="text"
                id={fieldName}
                value={formData[fieldName] || ''}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder={`Enter ${fieldName} (${fieldSchema.type})`}
              />
            )}
          </div>
        ))}
        
        <button
          onClick={handleCreateProposal}
          disabled={isSubmitting}
          className="mt-4 rounded-full border border-solid border-black/[.08] bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isSubmitting ? 'Creating Proposal...' : 'Create Proposal'}
        </button>
      </div>
    </div>
  );
}

// Simple YAML parser for collection config
function parseCollectionConfig(yamlContent: string): CollectionSchema {
  const config: CollectionSchema = {
    schema: { properties: {}, required: [] },
    storage: {}
  };

  const lines = yamlContent.split(/\r?\n/);
  let currentSection: 'schema' | 'storage' | 'properties' | null = null;
  let currentProperty: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect sections
    if (line.trim() === 'schema:') {
      currentSection = 'schema';
      continue;
    }
    if (line.trim() === 'storage:') {
      currentSection = 'storage';
      continue;
    }
    if (line.trim() === 'properties:') {
      currentSection = 'properties';
      continue;
    }

    // Parse storage section
    if (currentSection === 'storage') {
      const pathMatch = line.match(/^\s+path:\s*(.+)$/);
      if (pathMatch) {
        config.storage!.path = pathMatch[1].trim();
        continue;
      }
      const formatMatch = line.match(/^\s+format:\s*(.+)$/);
      if (formatMatch) {
        config.storage!.format = formatMatch[1].trim();
        continue;
      }
      const idFieldMatch = line.match(/^\s+idField:\s*(.+)$/);
      if (idFieldMatch) {
        config.storage!.idField = idFieldMatch[1].trim();
        continue;
      }
    }

    // Parse properties section
    if (currentSection === 'properties') {
      // Property name (4 spaces indent)
      const propMatch = line.match(/^\s{4}([a-zA-Z0-9_]+):\s*$/);
      if (propMatch) {
        currentProperty = propMatch[1];
        if (!config.schema!.properties![currentProperty]) {
          config.schema!.properties![currentProperty] = { type: 'string' };
        }
        continue;
      }

      if (currentProperty) {
        // Type (6 spaces indent)
        const typeMatch = line.match(/^\s{6}type:\s*(.+)$/);
        if (typeMatch) {
          config.schema!.properties![currentProperty].type = typeMatch[1].trim();
          continue;
        }

        // Description (6 spaces indent)
        const descMatch = line.match(/^\s{6}description:\s*(.+)$/);
        if (descMatch) {
          config.schema!.properties![currentProperty].description = descMatch[1].trim();
          continue;
        }
      }
    }

    // Parse required fields
    if (currentSection === 'schema') {
      const requiredMatch = line.match(/^\s+required:\s*$/);
      if (requiredMatch) {
        // Look ahead for required fields
        let j = i + 1;
        while (j < lines.length) {
          const reqField = lines[j].match(/^\s+-\s*(.+)$/);
          if (reqField) {
            config.schema!.required!.push(reqField[1].trim());
            j++;
          } else {
            break;
          }
        }
        i = j - 1;
      }
    }
  }

  return config;
}
