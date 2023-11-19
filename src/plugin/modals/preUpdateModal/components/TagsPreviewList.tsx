import React, {useState, useEffect, useRef} from "react";
import {ToggleButton} from "../../../../react/shared-components/ToggleButton";
import classNames from "classnames";

export interface TagsPreviewListProps {
	fetchTagsFunction: () => Promise<string[]>;
	onAccept: (acceptedTags: string[]) => void;
	onCancel: () => void;
}

export function TagsPreviewList(props: TagsPreviewListProps): JSX.Element {
	const {fetchTagsFunction, onAccept, onCancel} = props;

	const initialized = useRef(false);
	const [tags, setTags] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [acceptedTags, setAcceptedTags] = React.useState<string[]>(tags);
	const [isSlowLoading, setIsSlowLoading] = useState(false);

	const handleTagToggle = (tag: string, isActive: boolean) => {
		if (isActive) {
			setAcceptedTags(prev => [...prev, tag]);
		} else {
			setAcceptedTags(prev => prev.filter(t => t !== tag));
		}
	};

	useEffect(() => {
		async function fetchTags() {
			const fetchedTags = await fetchTagsFunction();
			setTags(fetchedTags);
			setAcceptedTags(fetchedTags);
			setIsLoading(false);
		}

		if (!initialized.current) {
			initialized.current = true;

			fetchTags();
		}
	}, []);

	useEffect(() => {
		if (!isLoading) {
			setIsSlowLoading(false);
			return;
		}

		const timeout = setTimeout(() => {
			setIsSlowLoading(true);
		}, 1000);
		return () => clearTimeout(timeout);
	}, [isLoading]);

	return (
		<div>
			{isLoading ? <div>
					Loading...
					<br/>
					{isSlowLoading ?
						<div className="text-sm text-gray-400">OpenAI can be really slow at times, please wait...</div>
						: <br/>
					}
				</div> :
				<div className="space-y-2">
					{
						tags.map((tag) =>
							<ToggleButton
								key={tag}
								className="autotag-plugin__toggle"
								labelRight={<span className="label-right">#{tag}</span>}
								defaultActive={true}
								onChange={(isActive: boolean) => handleTagToggle(tag, isActive)}
							/>
						)
					}
				</div>
			}
			<div className="mt-8 space-x-2">
				<button
					onClick={onCancel}
					className="btn btn-secondary"
				>
					Cancel
				</button>
				<button
					onClick={() => onAccept(acceptedTags)}
					className={classNames(`btn mod-cta`, {'opacity-40': acceptedTags.length === 0})}
					disabled={acceptedTags.length === 0}
				>
					Accept
				</button>
			</div>
		</div>
	)
		;
}
