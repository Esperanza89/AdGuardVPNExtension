import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { ExclusionsType, ExclusionDtoInterface, ICON_FOR_DOMAIN } from '../../../../../common/exclusionsConstants';
import { StateCheckbox } from '../../StateCheckbox';
import { rootStore } from '../../../../stores';
import { SearchHighlighter } from '../../Search/SearchHighlighter';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './list-item.pcss';

interface ListItemProps {
    exclusion: ExclusionDtoInterface;
}

export const ListItem = observer(({ exclusion }: ListItemProps) => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const icon = useRef<HTMLImageElement>(null);

    const removeExclusion = (exclusion: ExclusionDtoInterface) => async () => {
        const deletedExclusionsCount = await exclusionsStore.removeExclusion(exclusion);
        notificationsStore.notifySuccess(reactTranslator.getMessage(
            'options_exclusions_deleted_exclusions',
            { count: deletedExclusionsCount },
        ), {
            action: reactTranslator.getMessage('settings_exclusions_undo'),
            handler: exclusionsStore.restoreExclusions,
        });
    };

    const toggleState = () => {
        exclusionsStore.toggleExclusionState(exclusion.id);
    };

    const followToChildren = (exclusion: ExclusionDtoInterface) => () => {
        if (exclusion.children.length === 0) {
            return;
        }
        exclusionsStore.setSelectedExclusionId(exclusion.id);
    };

    const listIndexTitleClasses = (hasChildren: boolean) => cn('list-item__title', {
        'ip-title': !hasChildren,
    });

    useEffect(() => {
        if (icon.current && exclusion.type === ExclusionsType.Service && exclusion.iconUrl) {
            icon.current.onerror = () => {
                if (icon.current) {
                    icon.current.src = './assets/images/ip-icon.svg';
                }
            };
            icon.current.src = exclusion.iconUrl;
        }

        if (exclusion.type === ExclusionsType.Group) {
            const preloadedIcon = new Image();
            preloadedIcon.src = `${ICON_FOR_DOMAIN}${exclusion.hostname}`;
            preloadedIcon.onload = () => {
                if (icon.current) {
                    icon.current.src = preloadedIcon.src;
                }
            };
        }
    });

    return (
        <li
            key={exclusion.id}
            className="list-item"
        >
            <StateCheckbox
                state={exclusion.state}
                toggleHandler={toggleState}
                extraClassName="state-checkbox__list-item"
            />
            <button
                type="button"
                className={listIndexTitleClasses(exclusion.children.length > 0)}
                onClick={followToChildren(exclusion)}
            >
                <img
                    src="./assets/images/ip-icon.svg"
                    ref={icon}
                    className="list-item__title__icon"
                    alt="exclusion icon"
                />
                <SearchHighlighter
                    value={exclusion.hostname}
                    search={exclusionsStore.exclusionsSearchValue}
                />
                <svg className="icon list-item__arrow">
                    <use xlinkHref="#small-arrow" />
                </svg>
            </button>
            <button
                type="button"
                className="list-item__remove-button"
                onClick={removeExclusion(exclusion)}
            >
                <svg className="list-item__remove-button__icon">
                    <use xlinkHref="#basket" />
                </svg>
            </button>
        </li>
    );
});
