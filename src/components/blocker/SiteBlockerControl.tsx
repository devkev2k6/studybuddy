import React, { useState } from 'react';
import type { BlockerConfig, BlockerMode } from '../../types/guardian';
import { defaultBlockerConfig } from '../../lib/mocks/guardianMocks';

export interface SiteBlockerControlProps {
  config?: BlockerConfig;
  onChange?: (newConfig: BlockerConfig) => void;
}

export const SiteBlockerControl: React.FC<SiteBlockerControlProps> = ({
  config: externalConfig,
  onChange,
}) => {
  const [config, setConfig] = useState<BlockerConfig>(
    externalConfig ?? {
      mode: 'STUDY_ONLY',
      whitelistedDomains: [
        'coursera.org',
        'pw.live (PhysicsWallah)',
        'chatgpt.com',
        'gemini.google.com',
        'khanacademy.org',
        'developer.mozilla.org',
        'docs.python.org',
        'github.com',
        'stackoverflow.com',
        'leetcode.com',
      ],
    }
  );

  const [newDomain, setNewDomain] = useState<string>('');
  const [mockAttemptUrl, setMockAttemptUrl] = useState<string>('https://instagram.com/reels');

  const updateMode = (mode: BlockerMode) => {
    const updated = { ...config, mode };
    setConfig(updated);
    onChange?.(updated);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean || config.whitelistedDomains.includes(clean)) return;

    const updated: BlockerConfig = {
      ...config,
      whitelistedDomains: [...config.whitelistedDomains, clean],
    };
    setConfig(updated);
    onChange?.(updated);
    setNewDomain('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    const updated: BlockerConfig = {
      ...config,
      whitelistedDomains: config.whitelistedDomains.filter((d) => d !== domainToRemove),
    };
    setConfig(updated);
    onChange?.(updated);
  };

  return (
    <div
      style={{
        backgroundColor: '#0b1120',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Title & Status Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor:
                config.mode === 'BLOCK_ALL' ? '#f43f5e' : config.mode === 'STUDY_ONLY' ? '#06b6d4' : '#10b981',
              boxShadow: `0 0 10px ${
                config.mode === 'BLOCK_ALL' ? '#f43f5e' : config.mode === 'STUDY_ONLY' ? '#06b6d4' : '#10b981'
              }`,
            }}
          />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            Site Access Guardian
          </h2>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '3px 8px',
            borderRadius: '6px',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}
        >
          {config.whitelistedDomains.length} Whitelisted
        </span>
      </div>

      {/* 3-Mode Segmented Control */}
      <div
        role="group"
        aria-label="Site Access Modes"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          backgroundColor: '#020617',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid #1e293b',
          gap: '4px',
        }}
      >
        {/* Mode 1: ALLOW_ALL */}
        <button
          type="button"
          onClick={() => updateMode('ALLOW_ALL')}
          style={{
            padding: '8px 10px',
            borderRadius: '7px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transition: 'all 0.2s',
            backgroundColor: config.mode === 'ALLOW_ALL' ? '#10b981' : 'transparent',
            color: config.mode === 'ALLOW_ALL' ? '#ffffff' : '#94a3b8',
            boxShadow: config.mode === 'ALLOW_ALL' ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
          }}
        >
          <span>Allow All Sites</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>Open Browser</span>
        </button>

        {/* Mode 2: STUDY_ONLY */}
        <button
          type="button"
          onClick={() => updateMode('STUDY_ONLY')}
          style={{
            padding: '8px 10px',
            borderRadius: '7px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transition: 'all 0.2s',
            backgroundColor: config.mode === 'STUDY_ONLY' ? '#0284c7' : 'transparent',
            color: config.mode === 'STUDY_ONLY' ? '#ffffff' : '#94a3b8',
            boxShadow: config.mode === 'STUDY_ONLY' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none',
          }}
        >
          <span>Study Sites Only</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>Curated Whitelist</span>
        </button>

        {/* Mode 3: BLOCK_ALL */}
        <button
          type="button"
          onClick={() => updateMode('BLOCK_ALL')}
          style={{
            padding: '8px 10px',
            borderRadius: '7px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transition: 'all 0.2s',
            backgroundColor: config.mode === 'BLOCK_ALL' ? '#e11d48' : 'transparent',
            color: config.mode === 'BLOCK_ALL' ? '#ffffff' : '#94a3b8',
            boxShadow: config.mode === 'BLOCK_ALL' ? '0 2px 8px rgba(225, 29, 72, 0.4)' : 'none',
          }}
        >
          <span>Block All Sites</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>Strict Lockdown</span>
        </button>
      </div>

      {/* Dynamic Mode Feedback */}
      {config.mode === 'BLOCK_ALL' ? (
        /* Defensive Shield Mock Browser Window */
        <div
          style={{
            borderRadius: '10px',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            backgroundColor: '#020617',
            overflow: 'hidden',
          }}
        >
          {/* Mock Browser Header */}
          <div
            style={{
              backgroundColor: '#0f172a',
              padding: '8px 12px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: '#020617',
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ color: '#ef4444' }}>🔒</span>
              <span>{mockAttemptUrl}</span>
            </div>
          </div>

          {/* Defensive Shield Body */}
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              background: 'radial-gradient(circle at center, rgba(225, 29, 72, 0.12) 0%, transparent 70%)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185',
                fontSize: '1.25rem',
              }}
            >
              🛡️
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fecdd3' }}>
                Distraction Blocked — Return to Session
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', maxWidth: '380px', marginTop: '4px' }}>
                Strict Lockdown Mode is actively shielding your attention. External network traffic and unauthorized
                browser navigation are restricted.
              </p>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                padding: '4px 10px',
                borderRadius: '6px',
                color: '#fda4af',
                border: '1px solid rgba(244, 63, 94, 0.25)',
              }}
            >
              Focus Shield Intercept Active
            </div>
          </div>
        </div>
      ) : (
        /* Whitelist Management Tag List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>
              {config.mode === 'STUDY_ONLY' ? 'Active Approved Educational Whitelist' : 'Open Access Reference List'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Click × to remove</span>
          </div>

          {/* Interactive Tag Chips */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              maxHeight: '120px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {config.whitelistedDomains.map((domain) => (
              <span
                key={domain}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 9px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                  transition: 'border-color 0.2s',
                }}
              >
                <span>{domain}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDomain(domain)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  title="Remove domain"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Add Domain Input Field */}
          <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              placeholder="Add domain (e.g. mit.edu, arxiv.org)..."
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: '#020617',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.8rem',
                color: '#f8fafc',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
            />
            <button
              type="submit"
              style={{
                padding: '7px 14px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b';
              }}
            >
              + Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
