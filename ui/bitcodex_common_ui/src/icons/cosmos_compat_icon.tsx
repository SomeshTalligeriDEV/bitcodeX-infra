import { s3BucketURL } from "./paths";

export const CosmosCompatIcon: FC<CosmosCompatIconProps> = ({
  width = 20,
  height = 20,
}) => {
  return (
    <img
      src={`${s3BucketURL}/keplr.png`}
      alt="Keplr"
      width={width}
      height={height}
    />
  );
};

export interface CosmosCompatIconProps {
  width?: number;
  height?: number;
}
