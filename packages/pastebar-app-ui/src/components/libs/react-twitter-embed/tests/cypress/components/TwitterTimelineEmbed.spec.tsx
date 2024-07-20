import { mount } from '@cypress/react';
import React from 'react';
import TwitterTimelineEmbed from '../../../components/TwitterTimelineEmbed';

describe('Twitter Timeline', () => {
  it('should render timeline with screenName', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='profile'
        screenName='saurabhnemade'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('Tweets by ');
  });

  it('should render timeline with userId', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='profile'
        userId='1934309676'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('Tweets by ');
  });

  it('should render timeline likes with screenName', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='likes'
        screenName='saurabhnemade'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('liked by');
  });

  it('should render timeline likes with userId', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='likes'
        userId='1934309676'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('liked by');
  });

  it('should render timeline list with owner screen name slug', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='list'
        ownerScreenName='palafo'
        slug='breakingnews'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('BreakingNews');
    cy.getIframeBody().contains('A Twitter list by');
  });

  it('should render timeline list with list id', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='list'
        id='8044403'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('meetup-20100301');
    cy.getIframeBody().contains('A Twitter list by');
  });

  it('should render timeline collection with id', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='collection'
        id='576828964162965504'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('Dyeing the Chicago River');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline collection with url', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='collection'
        url='https://twitter.com/NYTNow/timelines/576828964162965504'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('Dyeing the Chicago River');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline collection with profile url', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='url'
        url='https://twitter.com/rahul581'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('Rahul Kadam');
  });

  it('should render timeline collection with list url', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='url'
        url='https://twitter.com/mashable/lists/social-media'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('Social Media');
    cy.getIframeBody().contains('A Twitter list by');
  });

  it('should render timeline collection with Likes url', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='url'
        url='https://twitter.com/ladygaga/likes'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('Twitter');
    cy.getIframeBody().contains('liked by');
  });

  it('should render timeline widget id', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='widget'
        widgetId='539487832448843776'
        options={{ height: 400 }}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with auto height', () => {
    mount(
      <div style={{ height: 800 }}>
        <TwitterTimelineEmbed
          sourceType='widget'
          widgetId='539487832448843776'
          autoHeight
        />
      </div>
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with dark theme', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with light theme', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='light'
        widgetId='539487832448843776'
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with custom border', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        borderColor='#F44336'
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with no header', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        borderColor='#F44336'
        noHeader
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with no footer', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        borderColor='#F44336'
        noFooter
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with no header and no footer', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        borderColor='#F44336'
        noHeader
        noFooter
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with no border', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        borderColor='#F44336'
        noBorders
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline widget with no scrollbar', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        borderColor='#F44336'
        noScrollbar
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline transparent background', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        borderColor='#F44336'
        transparent
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('Curated Tweets by');
  });

  it('should render timeline with custom language', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        lang='hi'
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('द्वारा संजोए गए ट्वीट');
  });

  it('should render timeline with placeholder', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        lang='hi'
        placeholder='Loading'
      />
    );
    cy.contains('Loading');
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('द्वारा संजोए गए ट्वीट');
  });

  it('should render timeline with custom placeholder', () => {
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        lang='hi'
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
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('द्वारा संजोए गए ट्वीट');
  });

  it('should render timeline with onLoadd', () => {
    const callback = cy.stub();
    mount(
      <TwitterTimelineEmbed
        sourceType='timeline'
        theme='dark'
        widgetId='539487832448843776'
        lang='hi'
        onLoad={callback}
      />
    );
    cy.wait(4000);
    cy.getIframeBody().contains('National Park Tweets');
    cy.getIframeBody().contains('द्वारा संजोए गए ट्वीट');
    cy.waitUntil(() => expect(callback.callCount).to.eq(1));
  });
});
