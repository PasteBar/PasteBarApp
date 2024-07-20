import { mount } from '@cypress/react';
import React from 'react';
import TwitterOnAirButton from '../../../components/TwitterOnAirButton';

describe('Twitter On Air Button', () => {
  it('should render onAir button with username', () => {
    mount(<TwitterOnAirButton username='KatmaiNPS' />);
    cy.wait(4000);
    cy.getIframeBody().contains('KatmaiNPS');
  });

  it('should render onAir button with options', () => {
    mount(
      <TwitterOnAirButton username='KatmaiNPS' options={{ size: 'large' }} />
    );
    cy.wait(1500);
    cy.getIframeBody().contains('KatmaiNPS');
  });

  it('should render onAir button with placeholder', () => {
    mount(
      <TwitterOnAirButton
        username='KatmaiNPS'
        options={{ size: 'large' }}
        placeholder='Loading'
      />
    );
    cy.contains('Loading');
    cy.wait(1500);
    cy.getIframeBody().contains('KatmaiNPS');
  });

  it('should render onAir button with custom placeholder', () => {
    mount(
      <TwitterOnAirButton
        username='KatmaiNPS'
        options={{ size: 'large' }}
        placeholder={
          <div
            style={{
              padding: 10,
              margin: 10,
              backgroundColor: 'red',
              color: 'white'
            }}
          >
            Hello I am custom placeholder
          </div>
        }
      />
    );
    cy.contains('Hello I am custom placeholder');
    cy.wait(1500);
    cy.getIframeBody().contains('KatmaiNPS');
  });

  it('should render onAir button with onLoad', () => {
    const callback = cy.stub();
    mount(<TwitterOnAirButton username='KatmaiNPS' onLoad={callback} />);
    cy.wait(1500);
    cy.getIframeBody().contains('KatmaiNPS');
    cy.waitUntil(() => expect(callback.callCount).to.eq(1));
  });
});
