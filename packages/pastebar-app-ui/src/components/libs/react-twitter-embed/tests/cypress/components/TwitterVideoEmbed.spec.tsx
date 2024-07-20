import { mount } from '@cypress/react';
import React from 'react';
import TwitterVideoEmbed from '../../../components/TwitterVideoEmbed';

describe('Twitter Video Embed', () => {
  it('should render video embed with id', () => {
    mount(<TwitterVideoEmbed id='560070183650213889' />);
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains(
      "You can now shoot, edit and share video on Twitter. Capture life's most moving moments from your perspective."
    );
  });

  it('should render video embed with placeholder', () => {
    mount(<TwitterVideoEmbed id='560070183650213889' placeholder='Loading' />);
    cy.contains('Loading');
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains(
      "You can now shoot, edit and share video on Twitter. Capture life's most moving moments from your perspective."
    );
  });

  it('should render video embed with custom placeholder', () => {
    mount(
      <TwitterVideoEmbed
        id='560070183650213889'
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
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains(
      "You can now shoot, edit and share video on Twitter. Capture life's most moving moments from your perspective."
    );
  });

  it('should render video embed with onLoad', () => {
    const callback = cy.stub();
    mount(<TwitterVideoEmbed id='560070183650213889' onLoad={callback} />);
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains(
      "You can now shoot, edit and share video on Twitter. Capture life's most moving moments from your perspective."
    );
    cy.waitUntil(() => expect(callback.callCount).to.eq(1));
  });
});
