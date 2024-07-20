import { mount } from '@cypress/react';
import React from 'react';
import TwitterFollowButton from '../../../components/TwitterFollowButton';

describe('Twitter Follow Button', () => {
  it('should render follow button with screenName', () => {
    mount(<TwitterFollowButton screenName='saurabhhnemade' />);
    cy.wait(3000);
    cy.getIframeBody().contains('Follow');
  });

  it('should render follow button with screenName and options', () => {
    mount(
      <TwitterFollowButton
        screenName='saurabhhnemade'
        options={{ size: 'large' }}
      />
    );
    cy.wait(1500);
    cy.getIframeBody().contains('Follow');
  });

  it('should render follow button with placeholder', () => {
    mount(
      <TwitterFollowButton
        screenName='saurabhhnemade'
        options={{ size: 'large' }}
        placeholder='Loading'
      />
    );
    cy.contains('Loading');
    cy.wait(1500);
    cy.getIframeBody().contains('Follow');
  });

  it('should render follow button with custom placeholder', () => {
    mount(
      <TwitterFollowButton
        screenName='saurabhhnemade'
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
    cy.getIframeBody().contains('Follow');
  });

  it('should render follow button with onLoad', () => {
    const callback = cy.stub();
    mount(
      <TwitterFollowButton screenName='saurabhhnemade' onLoad={callback} />
    );
    cy.wait(1500);
    cy.getIframeBody().contains('Follow');
    cy.waitUntil(() => expect(callback.callCount).to.eq(1));
  });
});
