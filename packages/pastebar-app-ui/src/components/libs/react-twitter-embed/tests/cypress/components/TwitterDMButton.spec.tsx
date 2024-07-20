import { mount } from '@cypress/react';
import React from 'react';
import TwitterDMButton from '../../../components/TwitterDMButton';

describe('Twitter DM Button', () => {
  it('should render direct message button with id', () => {
    mount(<TwitterDMButton id={1364031673} />);
    cy.wait(1500);
    cy.getIframeBody().contains('Message');
  });

  it('should render direct message button with id and options', () => {
    mount(<TwitterDMButton id={1364031673} options={{ size: 'large' }} />);
    cy.wait(1500);
    cy.getIframeBody().contains('Message');
  });

  it('should render direct message button with id and options', () => {
    mount(
      <TwitterDMButton
        id={1364031673}
        placeholder='Loading'
        options={{ size: 'large' }}
      />
    );
    cy.wait(1500);
    cy.getIframeBody().contains('Message');
  });

  it('should render direct message button with custom placeholder', () => {
    mount(
      <TwitterDMButton
        id={1364031673}
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
        options={{ size: 'large' }}
      />
    );
    cy.contains('Hello I am custom placeholder');
    cy.wait(1500);
    cy.getIframeBody().contains('Message');
  });

  it('should render direct message button with onLoad action', () => {
    const callback = cy.stub();
    mount(<TwitterDMButton id={1364031673} onLoad={callback} />);
    cy.wait(1500);
    cy.getIframeBody().contains('Message');
    cy.waitUntil(() => expect(callback.callCount).to.eq(1));
  });
});
