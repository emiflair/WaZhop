import clsx from 'clsx';
import { buildPriceDisplay } from '../utils/currency';

const PriceTag = ({
  price,
  currency,
  priceUSD,
  className,
  primaryClassName,
  primaryStyle,
  convertedClassName = 'text-xs text-gray-500 dark:text-gray-400',
  showConverted = true,
  layout = 'stack',
  children
}) => {
  const { primary, secondary } = buildPriceDisplay({ price, currency, priceUSD });

  const containerClass = layout === 'inline'
    ? 'flex flex-wrap items-baseline gap-1'
    : 'flex flex-col';

  return (
    <div className={clsx(containerClass, className)}>
      <span className={primaryClassName} style={primaryStyle}>{primary}</span>
      {showConverted && secondary && <span className={convertedClassName}>{secondary}</span>}
      {children}
    </div>
  );
};

export default PriceTag;
