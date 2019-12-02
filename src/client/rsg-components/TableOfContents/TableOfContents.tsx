import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ComponentsList from 'rsg-components/ComponentsList';
import TableOfContentsRenderer from 'rsg-components/TableOfContents/TableOfContentsRenderer';
import filterSectionsByName from '../../utils/filterSectionsByName';
import { getHash } from '../../utils/handleHash';
import getUrl from '../../utils/getUrl';

interface TableOfContentsProps {
	sections: Rsg.Section[];
	useRouterLinks?: boolean;
	collapsibleSections?: boolean;
}

export default class TableOfContents extends Component<TableOfContentsProps> {
	public static propTypes = {
		sections: PropTypes.array.isRequired,
		useRouterLinks: PropTypes.bool,
		collapsibleSections: PropTypes.bool,
	};
	public state = {
		searchTerm: '',
	};

	private renderLevel(
		sections: (Rsg.Section | Rsg.Component)[],
		useRouterLinks = false,
		hashPath: string[] = [],
		useHashId = false
	): { content: React.ReactElement; containsSelected: boolean } {
		let childrenContainSelected = false;
		const items = sections.map(sectionOrComponent => {
			const section = sectionOrComponent as Rsg.Section;
			const children = [...(section.sections || []), ...(section.components || [])];
			const sectionDepth = section.sectionDepth || 0;
			const childHashPath =
				sectionDepth === 0 && useHashId
					? hashPath
					: [...hashPath, section.name ? section.name : '-'];

			const { content, containsSelected } =
				children.length > 0
					? this.renderLevel(children, useRouterLinks, childHashPath, sectionDepth === 0)
					: { content: undefined, containsSelected: false };

			// Match selected component in both basic routing and pagePerSection routing.
			const { hash, pathname } = window.location;
			const windowHash = pathname + (useRouterLinks ? hash : getHash(hash));

			// get href
			const href = getUrl({
				name: section.name,
				slug: section.slug,
				anchor: !useRouterLinks,
				hashPath: useRouterLinks ? hashPath : false,
				id: useRouterLinks ? useHashId : false,
			});

			if (containsSelected || (href && windowHash.indexOf(href) === 0)) {
				childrenContainSelected = true;
			}

			return {
				...section,
				heading: !!section.name && children.length > 0,
				content,
				forceOpen:
					!!this.state.searchTerm.length || !this.props.collapsibleSections || containsSelected,
			};
		});
		return {
			content: (
				<ComponentsList
					items={items}
					hashPath={hashPath}
					useHashId={useHashId}
					useRouterLinks={useRouterLinks}
				/>
			),
			containsSelected: childrenContainSelected,
		};
	}

	private renderSections() {
		const { searchTerm } = this.state;
		const { sections, useRouterLinks } = this.props;
		// If there is only one section, we treat it as a root section
		// In this case the name of the section won't be rendered and it won't get left padding
		// Since a section can contain only other sections,
		// we need to make sure not to loose the subsections.
		// We will treat those subsections as the new roots.
		const firstLevel =
			sections.length === 1
				? // only use subsections if there actually are subsections
				  sections[0].sections && sections[0].sections.length
					? sections[0].sections
					: sections[0].components
				: sections;
		const filtered = firstLevel ? filterSectionsByName(firstLevel, searchTerm) : firstLevel;

		return filtered ? this.renderLevel(filtered, useRouterLinks).content : null;
	}

	public render() {
		return (
			<TableOfContentsRenderer
				searchTerm={this.state.searchTerm}
				onSearchTermChange={searchTerm => this.setState({ searchTerm })}
			>
				{this.renderSections()}
			</TableOfContentsRenderer>
		);
	}
}